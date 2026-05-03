import { TestBed } from '@angular/core/testing';
import { FixedCostsStore } from './fixed-costs.store';
import { FirestoreService } from '../services/firestore.service';
import { of } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

describe('FixedCostsStore', () => {
  let store: typeof FixedCostsStore;
  let firestoreSpy: jasmine.SpyObj<FirestoreService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('FirestoreService', ['getCollection', 'addDocument', 'updateDocument', 'deleteDocument']);
    spy.getCollection.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        FixedCostsStore,
        { provide: FirestoreService, useValue: spy },
      ],
    });

    store = TestBed.inject(FixedCostsStore);
    firestoreSpy = TestBed.inject(FirestoreService) as jasmine.SpyObj<FirestoreService>;
  });

  describe('deactivateFixedCost', () => {
    it('should set active to false and populate endDate', async () => {
      const costId = 'test-id-123';

      await store.deactivateFixedCost(costId);

      expect(firestoreSpy.updateDocument).toHaveBeenCalledWith(
        'fixedCosts',
        costId,
        jasmine.objectContaining({
          active: false,
          endDate: jasmine.any(Timestamp),
        })
      );
    });

    it('should set endDate to current timestamp', async () => {
      const costId = 'test-id-456';
      const beforeDeactivate = Timestamp.now();

      await store.deactivateFixedCost(costId);

      const afterDeactivate = Timestamp.now();
      const callArgs = firestoreSpy.updateDocument.calls.mostRecent().args[2];

      expect(callArgs.endDate instanceof Timestamp).toBe(true);
      expect(callArgs.endDate.seconds).toBeGreaterThanOrEqual(beforeDeactivate.seconds);
      expect(callArgs.endDate.seconds).toBeLessThanOrEqual(afterDeactivate.seconds);
    });

    it('should propagate errors from firestore', async () => {
      const error = new Error('Firestore error');
      firestoreSpy.updateDocument.and.returnValue(Promise.reject(error));

      try {
        await store.deactivateFixedCost('test-id');
        fail('should have thrown');
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });

  describe('deleteFixedCost', () => {
    it('should call firestore deleteDocument', async () => {
      const costId = 'test-id-789';

      await store.deleteFixedCost(costId);

      expect(firestoreSpy.deleteDocument).toHaveBeenCalledWith('fixedCosts', costId);
    });
  });

  describe('createFixedCost', () => {
    it('should set initial active state to true and startDate to now', async () => {
      const input = { name: 'Test Cost', amount: 100, frequency: 'monthly' as const, category: 'utility' as const };
      firestoreSpy.addDocument.and.returnValue(Promise.resolve('new-id'));

      await store.createFixedCost(input);

      const callArgs = firestoreSpy.addDocument.calls.mostRecent().args[1];
      expect(callArgs.active).toBe(true);
      expect(callArgs.startDate instanceof Timestamp).toBe(true);
      expect(callArgs.endDate).toBeNull();
    });
  });
});
