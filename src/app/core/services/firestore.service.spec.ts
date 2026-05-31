import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { FIRESTORE_API, FirestoreService } from './firestore.service';


describe('FirestoreService', () => {
  let service: FirestoreService;
  let firestoreApi: {
    addDoc: ReturnType<typeof vi.fn>;
    collection: ReturnType<typeof vi.fn>;
    collectionData: ReturnType<typeof vi.fn>;
    deleteDoc: ReturnType<typeof vi.fn>;
    doc: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
    runTransaction: ReturnType<typeof vi.fn>;
    timestampNow: ReturnType<typeof vi.fn>;
    updateDoc: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    firestoreApi = {
      addDoc: vi.fn(),
      collection: vi.fn(),
      collectionData: vi.fn(),
      deleteDoc: vi.fn(),
      doc: vi.fn(),
      query: vi.fn(),
      runTransaction: vi.fn(),
      timestampNow: vi.fn().mockReturnValue({}),
      updateDoc: vi.fn(),
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
    const get = vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ currentStock: 2 }) });

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
    expect(set.mock.calls[0][1]).toEqual(expect.objectContaining({ ingredientId: 'ing-1', quantity: -2 }));
  });
});
