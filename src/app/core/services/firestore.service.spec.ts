import { TestBed } from '@angular/core/testing';
import { FirestoreService } from './firestore.service';
import { Firestore } from '@angular/fire/firestore';
vi.mock('@angular/fire/firestore', () => ({
  Firestore: {} as never,
  Timestamp: { now: vi.fn() } as never,
  addDoc: vi.fn(),
  collection: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
}));
import * as afs from '@angular/fire/firestore';

const mockedAfs = vi.mocked(afs);

describe('FirestoreService', () => {
  let service: FirestoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FirestoreService, { provide: Firestore, useValue: {} }] });
    service = TestBed.inject(FirestoreService);
  });

  it('addDocument removes id from payload', async () => {
    mockedAfs.addDoc.mockResolvedValue({ id: 'abc' } as never);
    mockedAfs.collection.mockReturnValue({} as never);

    const id = await service.addDocument('recipes', { id: 'legacy', name: 'Pan' });

    expect(id).toBe('abc');
    expect(mockedAfs.addDoc).toHaveBeenCalledWith(expect.anything(), { name: 'Pan' });
  });

  it('updateDocument removes id from payload', async () => {
    mockedAfs.updateDoc.mockResolvedValue(undefined);
    mockedAfs.doc.mockReturnValue({} as never);

    await service.updateDocument('recipes', 'id-1', { id: 'x', name: 'Nuevo' });

    expect(mockedAfs.updateDoc).toHaveBeenCalledWith(expect.anything(), { name: 'Nuevo' });
  });

  it('applyStockAdjustments avoids negative stock and skips zero delta movement', async () => {
    const update = vi.fn();
    const set = vi.fn();
    const get = vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ currentStock: 2 }) });

    mockedAfs.runTransaction.mockImplementation(async (_db: unknown, cb: unknown) => (cb as (ctx: unknown) => Promise<void>)({ get, update, set } as never));
    mockedAfs.doc.mockReturnValue({} as never);
    mockedAfs.collection.mockReturnValue({} as never);

    await service.applyStockAdjustments('sale-1', 'sale_deduction', [
      { ingredientId: 'ing-1', ingredientName: 'Harina', delta: -5 },
      { ingredientId: 'ing-2', ingredientName: 'Leche', delta: 0 },
    ]);

    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledTimes(1);
    expect(set.mock.calls[0][1]).toEqual(expect.objectContaining({ ingredientId: 'ing-1', quantity: -2 }));
  });
});
