import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { FIRESTORE_API, FirestoreService } from './firestore.service';

const buildQuerySnapshot = (ids: string[]) => ({
  docs: ids.map((id) => ({ id, data: () => ({ label: id }) })),
});

describe('FirestoreService', () => {
  let service: FirestoreService;
  let firestoreApi: {
    addDoc: ReturnType<typeof vi.fn>;
    collection: ReturnType<typeof vi.fn>;
    collectionData: ReturnType<typeof vi.fn>;
    deleteDoc: ReturnType<typeof vi.fn>;
    doc: ReturnType<typeof vi.fn>;
    getDocs: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
    runTransaction: ReturnType<typeof vi.fn>;
    timestampNow: ReturnType<typeof vi.fn>;
    updateDoc: ReturnType<typeof vi.fn>;
    writeBatch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    TestBed.configureTestingModule({
      providers: [FirestoreService, { provide: Firestore, useValue: {} }],
    });
    firestoreApi = {
      addDoc: vi.fn(),
      collection: vi.fn(),
      collectionData: vi.fn(),
      deleteDoc: vi.fn(),
      doc: vi.fn(),
      getDocs: vi.fn(),
      query: vi.fn(),
      runTransaction: vi.fn(),
      timestampNow: vi.fn().mockReturnValue({}),
      updateDoc: vi.fn(),
      writeBatch: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        FirestoreService,
        { provide: Firestore, useValue: {} },
        { provide: FIRESTORE_API, useValue: firestoreApi },
      ],
    });
    service = TestBed.inject(FirestoreService);
  });

  it('addDocument removes id from payload', async () => {
    firestoreApi.addDoc.mockResolvedValue({ id: 'abc' } as never);
    firestoreApi.collection.mockReturnValue({} as never);

    const id = await service.addDocument('recipes', { id: 'legacy', name: 'Pan' });

    expect(id).toBe('abc');
    expect(firestoreApi.addDoc).toHaveBeenCalledWith(expect.anything(), { name: 'Pan' });
  });

  it('updateDocument removes id from payload', async () => {
    firestoreApi.updateDoc.mockResolvedValue(undefined);
    firestoreApi.doc.mockReturnValue({} as never);

    await service.updateDocument('recipes', 'id-1', { id: 'x', name: 'Nuevo' });

    expect(firestoreApi.updateDoc).toHaveBeenCalledWith(expect.anything(), { name: 'Nuevo' });
  });

  it('applyStockAdjustments avoids negative stock and skips zero delta movement', async () => {
    const update = vi.fn();
    const set = vi.fn();
    const get = vi
      .fn()
      .mockResolvedValue({ exists: () => true, data: () => ({ currentStock: 2 }) });

    firestoreApi.runTransaction.mockImplementation(async (_db: unknown, cb: unknown) =>
      (cb as (ctx: unknown) => Promise<void>)({ get, update, set } as never),
    );
    firestoreApi.doc.mockReturnValue({} as never);
    firestoreApi.collection.mockReturnValue({} as never);

    await service.applyStockAdjustments('sale-1', 'sale_deduction', [
      { ingredientId: 'ing-1', ingredientName: 'Harina', delta: -5 },
      { ingredientId: 'ing-2', ingredientName: 'Leche', delta: 0 },
    ]);

    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledTimes(1);
    expect(set.mock.calls[0][1]).toEqual(
      expect.objectContaining({ ingredientId: 'ing-1', quantity: -2 }),
    );
  });

  it('parseBackupJson validates the expected schema', () => {
    const valid = JSON.stringify({
      schema: 'lucis-gestion-backup',
      version: 1,
      generatedAt: new Date().toISOString(),
      collections: {
        users: [],
        ingredients: [],
        recipes: [],
        customers: [],
        sales: [],
        priceHistory: [],
        stockMovements: [],
        supplyExpenses: [],
        fixedCostsByMonth: [],
      },
    });

    expect(service.parseBackupJson(valid).schema).toBe('lucis-gestion-backup');
    expect(() => service.parseBackupJson('{bad json')).toThrow();
    expect(() => service.parseBackupJson(JSON.stringify({ schema: 'other', version: 1 }))).toThrow();
  });

  it('restoreBackup writes backup docs first and only deletes stale docs', async () => {
    firestoreApi.collection.mockReturnValue({} as never);
    firestoreApi.getDocs.mockResolvedValue(buildQuerySnapshot(['existing-1', 'stale-1']) as never);
    firestoreApi.doc.mockImplementation((...args: unknown[]) => ({ path: args.join('/') }) as never);

    const set = vi.fn();
    const del = vi.fn();
    const commit = vi.fn().mockResolvedValue(undefined);
    firestoreApi.writeBatch.mockImplementation(() => ({ set, delete: del, commit }) as never);

    const backup = {
      schema: 'lucis-gestion-backup' as const,
      version: 1 as const,
      generatedAt: new Date().toISOString(),
      collections: {
        users: [{ id: 'existing-1', data: { label: 'u' } }],
        ingredients: [{ id: 'existing-1', data: { label: 'i' } }],
        recipes: [{ id: 'existing-1', data: { label: 'r' } }],
        customers: [{ id: 'existing-1', data: { label: 'c' } }],
        sales: [{ id: 'existing-1', data: { label: 's' } }],
        priceHistory: [{ id: 'existing-1', data: { label: 'ph' } }],
        stockMovements: [{ id: 'existing-1', data: { label: 'sm' } }],
        supplyExpenses: [{ id: 'existing-1', data: { label: 'se' } }],
        fixedCostsByMonth: [{ id: 'existing-1', data: { label: 'fc' } }],
      },
    };

    await service.restoreBackup(backup);

    expect(set).toHaveBeenCalled();
    expect(del).toHaveBeenCalled();
    expect(del).not.toHaveBeenCalledWith(expect.objectContaining({ path: expect.stringContaining('existing-1') }));
  });
});
