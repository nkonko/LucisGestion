import { TestBed } from '@angular/core/testing';
import { FirestoreService } from './firestore.service';
import { Firestore } from '@angular/fire/firestore';
vi.mock('@angular/fire/firestore', () => ({
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

describe.skip('FirestoreService', () => {
  let service: FirestoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FirestoreService, { provide: Firestore, useValue: {} }] });
    service = TestBed.inject(FirestoreService);
  });

  it('addDocument removes id from payload', async () => {
    (afs.addDoc as unknown as any).mockResolvedValue({ id: 'abc' } as never);
    (afs.collection as unknown as any).mockReturnValue({} as never);

    const id = await service.addDocument('recipes', { id: 'legacy', name: 'Pan' });

    expect(id).toBe('abc');
    expect(afs.addDoc).toHaveBeenCalledWith(expect.anything(), { name: 'Pan' });
  });

  it('updateDocument removes id from payload', async () => {
    (afs.updateDoc as unknown as any).mockResolvedValue(undefined);
    (afs.doc as unknown as any).mockReturnValue({} as never);

    await service.updateDocument('recipes', 'id-1', { id: 'x', name: 'Nuevo' });

    expect(afs.updateDoc).toHaveBeenCalledWith(expect.anything(), { name: 'Nuevo' });
  });

  it('applyStockAdjustments avoids negative stock and skips zero delta movement', async () => {
    const update = vi.fn();
    const set = vi.fn();
    const get = vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ currentStock: 2 }) });

    (afs.runTransaction as unknown as any).mockImplementation(async (_db: unknown, cb: any) => cb({ get, update, set } as never));
    (afs.doc as unknown as any).mockReturnValue({} as never);
    (afs.collection as unknown as any).mockReturnValue({} as never);

    await service.applyStockAdjustments('sale-1', 'sale_deduction', [
      { ingredientId: 'ing-1', ingredientName: 'Harina', delta: -5 },
      { ingredientId: 'ing-2', ingredientName: 'Leche', delta: 0 },
    ]);

    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledTimes(1);
    expect(set.mock.calls[0][1]).toEqual(expect.objectContaining({ ingredientId: 'ing-1', quantity: -2 }));
  });
});
