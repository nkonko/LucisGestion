import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { FixedCostsStore } from './fixed-costs.store';
import { FirestoreService } from '../services/firestore.service';
import { FixedCostMonthDoc } from '../models/fixed-cost';

describe('FixedCostsStore', () => {
  let store: InstanceType<typeof FixedCostsStore>;
  let docs$: BehaviorSubject<FixedCostMonthDoc[]>;
  let firestoreSpy: {
    getCollection: ReturnType<typeof vi.fn>;
    addDocument: ReturnType<typeof vi.fn>;
    updateDocument: ReturnType<typeof vi.fn>;
    deleteDocument: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    docs$ = new BehaviorSubject<FixedCostMonthDoc[]>([]);
    let nextId = 0;
    firestoreSpy = {
      getCollection: vi.fn().mockReturnValue(docs$.asObservable()),
      addDocument: vi.fn().mockImplementation(async (_path: string, data: FixedCostMonthDoc) => {
        const id = `auto-${++nextId}`;
        docs$.next([...docs$.value, { id, ...data }]);
        return id;
      }),
      updateDocument: vi
        .fn()
        .mockImplementation(async (_path: string, id: string, data: Record<string, unknown>) => {
          docs$.next(docs$.value.map((d) => (d.id === id ? { ...d, ...data } : d)));
        }),
      deleteDocument: vi.fn().mockImplementation(async (_path: string, id: string) => {
        docs$.next(docs$.value.filter((d) => d.id !== id));
      }),
    };

    TestBed.configureTestingModule({
      providers: [FixedCostsStore, { provide: FirestoreService, useValue: firestoreSpy }],
    });

    store = TestBed.inject(FixedCostsStore);
  });

  function seed(docs: FixedCostMonthDoc[]): void {
    docs$.next(docs.map((d, i) => ({ id: d.id ?? `seed-${i}`, ...d })));
  }

  describe('statusForMonth', () => {
    it('returns empty when no edits exist', () => {
      expect(store.statusForMonth('2026-05')).toEqual({ kind: 'empty' });
    });

    it('returns edited when month has docs', () => {
      seed([
        { monthKey: '2026-05', isAnchor: true },
        { monthKey: '2026-05', lineageId: 'lin-a', name: 'Luz', amount: 100, category: 'utilities' },
      ]);
      expect(store.statusForMonth('2026-05')).toEqual({ kind: 'edited' });
    });

    it('returns inherited when prior month has costs', () => {
      seed([
        { monthKey: '2026-04', isAnchor: true },
        { monthKey: '2026-04', lineageId: 'lin-a', name: 'Luz', amount: 100, category: 'utilities' },
      ]);
      expect(store.statusForMonth('2026-05')).toEqual({
        kind: 'inherited',
        sourceMonthKey: '2026-04',
      });
    });
  });

  describe('entriesForMonth', () => {
    it('returns inherited entries from prior month when current month is empty', () => {
      seed([
        { monthKey: '2026-04', isAnchor: true },
        {
          monthKey: '2026-04',
          lineageId: 'lin-a',
          name: 'Luz',
          amount: 100,
          category: 'utilities',
          description: '',
        },
      ]);
      const entries = store.entriesForMonth('2026-05');
      expect(entries).toHaveLength(1);
      expect(entries[0].lineageId).toBe('lin-a');
      expect(entries[0].monthKey).toBe('2026-05');
    });

    it('skips anchor docs in the listing', () => {
      seed([
        { monthKey: '2026-05', isAnchor: true },
        {
          monthKey: '2026-05',
          lineageId: 'lin-a',
          name: 'Luz',
          amount: 100,
          category: 'utilities',
        },
      ]);
      expect(store.entriesForMonth('2026-05')).toHaveLength(1);
    });
  });

  describe('totalForMonth', () => {
    it('sums effective entries for the month', () => {
      seed([
        { monthKey: '2026-05', isAnchor: true },
        { monthKey: '2026-05', lineageId: 'a', name: 'A', amount: 100, category: 'utilities' },
        { monthKey: '2026-05', lineageId: 'b', name: 'B', amount: 250, category: 'rent' },
      ]);
      expect(store.totalForMonth('2026-05')).toBe(350);
    });
  });

  describe('createForMonth', () => {
    it('materializes the month and adds the new entry', async () => {
      seed([
        { monthKey: '2026-04', isAnchor: true },
        {
          monthKey: '2026-04',
          lineageId: 'lin-a',
          name: 'Luz',
          amount: 100,
          category: 'utilities',
          description: '',
        },
      ]);

      await store.createForMonth('2026-05', {
        name: 'Internet',
        description: 'Fibertel',
        amount: 50,
        category: 'utilities',
      });

      const may = store.entriesForMonth('2026-05');
      expect(may.map((e) => e.name).sort()).toEqual(['Internet', 'Luz']);
      expect(store.statusForMonth('2026-05')).toEqual({ kind: 'edited' });
    });
  });

  describe('updateForMonth', () => {
    it('materializes inherited month and updates the targeted lineage', async () => {
      seed([
        { monthKey: '2026-04', isAnchor: true },
        {
          monthKey: '2026-04',
          lineageId: 'lin-a',
          name: 'Luz',
          amount: 100,
          category: 'utilities',
          description: '',
        },
      ]);

      await store.updateForMonth('2026-05', 'lin-a', {
        name: 'Luz',
        description: '',
        amount: 180,
        category: 'utilities',
      });

      expect(store.totalForMonth('2026-05')).toBe(180);
      expect(store.totalForMonth('2026-04')).toBe(100);
    });
  });

  describe('deleteForMonth', () => {
    it('removes the entry from the current month only', async () => {
      seed([
        { monthKey: '2026-04', isAnchor: true },
        {
          monthKey: '2026-04',
          lineageId: 'lin-a',
          name: 'Luz',
          amount: 100,
          category: 'utilities',
          description: '',
        },
      ]);

      await store.deleteForMonth('2026-05', 'lin-a');

      expect(store.entriesForMonth('2026-05')).toHaveLength(0);
      expect(store.entriesForMonth('2026-04')).toHaveLength(1);
      expect(store.statusForMonth('2026-05')).toEqual({ kind: 'edited' });
    });
  });

  describe('revertMonthToInherited', () => {
    it('drops every doc for the month so it falls back to inheritance', async () => {
      seed([
        { monthKey: '2026-04', isAnchor: true },
        {
          monthKey: '2026-04',
          lineageId: 'lin-a',
          name: 'Luz',
          amount: 100,
          category: 'utilities',
          description: '',
        },
        { monthKey: '2026-05', isAnchor: true },
        {
          monthKey: '2026-05',
          lineageId: 'lin-a',
          name: 'Luz',
          amount: 999,
          category: 'utilities',
          description: '',
        },
      ]);

      await store.revertMonthToInherited('2026-05');

      expect(store.statusForMonth('2026-05')).toEqual({
        kind: 'inherited',
        sourceMonthKey: '2026-04',
      });
      expect(store.totalForMonth('2026-05')).toBe(100);
    });
  });
});
