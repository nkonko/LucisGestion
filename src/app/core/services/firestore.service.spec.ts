import { TestBed } from '@angular/core/testing';
import { FirestoreService } from './firestore.service';
import { Firestore } from '@angular/fire/firestore';
import * as afs from '@angular/fire/firestore';

describe('FirestoreService', () => {
  let service: FirestoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FirestoreService, { provide: Firestore, useValue: {} }] });
    service = TestBed.inject(FirestoreService);
  });

  it('addDocument removes id from payload', async () => {
    const addDocSpy = vi.spyOn(afs, 'addDoc').mockResolvedValue({ id: 'abc' } as never);
    vi.spyOn(afs, 'collection').mockReturnValue({} as never);

    const id = await service.addDocument('recipes', { id: 'legacy', name: 'Pan' });

    expect(id).toBe('abc');
    expect(addDocSpy).toHaveBeenCalledWith(expect.anything(), { name: 'Pan' });
  });

  it('updateDocument removes id from payload', async () => {
    const updateSpy = vi.spyOn(afs, 'updateDoc').mockResolvedValue(undefined);
    vi.spyOn(afs, 'doc').mockReturnValue({} as never);

    await service.updateDocument('recipes', 'id-1', { id: 'x', name: 'Nuevo' });

    expect(updateSpy).toHaveBeenCalledWith(expect.anything(), { name: 'Nuevo' });
  });

  it('applyStockAdjustments avoids negative stock and skips zero delta movement', async () => {
    const update = vi.fn();
    const set = vi.fn();
    const get = vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ currentStock: 2 }) });

    vi.spyOn(afs, 'runTransaction').mockImplementation(async (_db, cb) => cb({ get, update, set } as never));
    vi.spyOn(afs, 'doc').mockReturnValue({} as never);
    vi.spyOn(afs, 'collection').mockReturnValue({} as never);

    await service.applyStockAdjustments('sale-1', 'sale_deduction', [
      { ingredientId: 'ing-1', ingredientName: 'Harina', delta: -5 },
      { ingredientId: 'ing-2', ingredientName: 'Leche', delta: 0 },
    ]);

    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledTimes(1);
    expect(set.mock.calls[0][1]).toEqual(expect.objectContaining({ ingredientId: 'ing-1', quantity: -2 }));
  });
});
