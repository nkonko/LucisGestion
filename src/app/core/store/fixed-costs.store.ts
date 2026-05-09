import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { FirestoreService } from '../services/firestore.service';
import {
  FixedCostMonthDoc,
  FixedCostEntry,
  FixedCostEntryInput,
  FixedCostMonthStatus,
} from '../models/fixed-cost';
import { BaseState } from './state/state';
import { getErrorMessage } from '../utils/error.utils';

const COLLECTION = 'fixedCostsByMonth';

function generateLineageId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `lin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toEntry(doc: FixedCostMonthDoc): FixedCostEntry | null {
  if (doc.isAnchor || !doc.lineageId) return null;
  return {
    id: doc.id,
    lineageId: doc.lineageId,
    monthKey: doc.monthKey,
    name: doc.name ?? '',
    description: doc.description ?? '',
    amount: typeof doc.amount === 'number' ? doc.amount : 0,
    category: doc.category ?? 'other',
  };
}

export const FixedCostsStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withComputed(() => {
    const fs = inject(FirestoreService);
    const docs$ = fs.getCollection<FixedCostMonthDoc>(COLLECTION);
    const allDocs = toSignal(docs$, { initialValue: [] as FixedCostMonthDoc[] });
    const editedMonths = computed(() => {
      const set = new Set<string>();
      for (const d of allDocs()) set.add(d.monthKey);
      return set;
    });
    return { allDocs, editedMonths };
  }),

  withMethods((store) => {
    const fs = inject(FirestoreService);

    function entriesForMonthRaw(monthKey: string): FixedCostEntry[] {
      const out: FixedCostEntry[] = [];
      for (const doc of store.allDocs()) {
        if (doc.monthKey !== monthKey) continue;
        const entry = toEntry(doc);
        if (entry) out.push(entry);
      }
      out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      return out;
    }

    function isMonthEdited(monthKey: string): boolean {
      return store.editedMonths().has(monthKey);
    }

    function inheritanceSource(monthKey: string): string | null {
      const editedPriorMonths: string[] = [];
      for (const m of store.editedMonths()) {
        if (m < monthKey) editedPriorMonths.push(m);
      }
      editedPriorMonths.sort().reverse();
      for (const m of editedPriorMonths) {
        if (entriesForMonthRaw(m).length > 0) return m;
      }
      return null;
    }

    function effectiveEntries(monthKey: string): FixedCostEntry[] {
      if (isMonthEdited(monthKey)) return entriesForMonthRaw(monthKey);
      const source = inheritanceSource(monthKey);
      if (!source) return [];
      return entriesForMonthRaw(source).map((e) => ({ ...e, monthKey, id: undefined }));
    }

    function statusForMonthInternal(monthKey: string): FixedCostMonthStatus {
      if (isMonthEdited(monthKey)) return { kind: 'edited' };
      const source = inheritanceSource(monthKey);
      if (source) return { kind: 'inherited', sourceMonthKey: source };
      return { kind: 'empty' };
    }

    async function ensureMaterialized(monthKey: string): Promise<void> {
      if (isMonthEdited(monthKey)) return;
      const inherited = effectiveEntries(monthKey);
      await fs.addDocument<FixedCostMonthDoc>(COLLECTION, {
        monthKey,
        isAnchor: true,
      });
      for (const entry of inherited) {
        await fs.addDocument<FixedCostMonthDoc>(COLLECTION, {
          monthKey,
          lineageId: entry.lineageId,
          name: entry.name,
          description: entry.description,
          amount: entry.amount,
          category: entry.category,
        });
      }
    }

    function findDocId(monthKey: string, lineageId: string): string | undefined {
      const doc = store
        .allDocs()
        .find((d) => d.monthKey === monthKey && d.lineageId === lineageId && !d.isAnchor);
      return doc?.id;
    }

    return {
      entriesForMonth(monthKey: string): FixedCostEntry[] {
        return effectiveEntries(monthKey);
      },

      statusForMonth(monthKey: string): FixedCostMonthStatus {
        return statusForMonthInternal(monthKey);
      },

      totalForMonth(monthKey: string): number {
        return effectiveEntries(monthKey).reduce((sum, e) => sum + e.amount, 0);
      },

      async createForMonth(monthKey: string, input: FixedCostEntryInput): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          await ensureMaterialized(monthKey);
          await fs.addDocument<FixedCostMonthDoc>(COLLECTION, {
            monthKey,
            lineageId: generateLineageId(),
            name: input.name,
            description: input.description,
            amount: input.amount,
            category: input.category,
          });
          patchState(store, { loading: false });
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async updateForMonth(
        monthKey: string,
        lineageId: string,
        changes: FixedCostEntryInput,
      ): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          await ensureMaterialized(monthKey);
          const id = findDocId(monthKey, lineageId);
          if (!id) {
            patchState(store, { loading: false });
            return;
          }
          await fs.updateDocument(COLLECTION, id, {
            name: changes.name,
            description: changes.description,
            amount: changes.amount,
            category: changes.category,
          });
          patchState(store, { loading: false });
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async deleteForMonth(monthKey: string, lineageId: string): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          await ensureMaterialized(monthKey);
          const id = findDocId(monthKey, lineageId);
          if (!id) {
            patchState(store, { loading: false });
            return;
          }
          await fs.deleteDocument(COLLECTION, id);
          patchState(store, { loading: false });
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async revertMonthToInherited(monthKey: string): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const docs = store.allDocs().filter((d) => d.monthKey === monthKey);
          for (const d of docs) {
            if (d.id) await fs.deleteDocument(COLLECTION, d.id);
          }
          patchState(store, { loading: false });
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },
    };
  }),
);
