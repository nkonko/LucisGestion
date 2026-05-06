import { TestBed } from '@angular/core/testing';
import { FixedCostsStore } from './fixed-costs.store';
import { FirestoreService } from '../services/firestore.service';
import { of } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

describe('FixedCostsStore', () => {
  let store: InstanceType<typeof FixedCostsStore>;
  let firestoreSpy: {
    getCollection: ReturnType<typeof vi.fn>;
    addDocument: ReturnType<typeof vi.fn>;
    updateDocument: ReturnType<typeof vi.fn>;
    deleteDocument: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const spy = {
      getCollection: vi.fn().mockReturnValue(of([])),
      addDocument: vi.fn(),
      updateDocument: vi.fn(),
      deleteDocument: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FixedCostsStore,
        { provide: FirestoreService, useValue: spy },
      ],
    });

    store = TestBed.inject(FixedCostsStore);
    firestoreSpy = TestBed.inject(FirestoreService) as unknown as typeof spy;
  });

  describe('deactivateFixedCost', () => {
    it('should set active to false and populate endDate', async () => {
      const costId = 'test-id-123';

      await store.deactivateFixedCost(costId);

      expect(firestoreSpy.updateDocument).toHaveBeenCalledWith(
        'fixedCosts',
        costId,
        expect.objectContaining({
          active: false,
          endDate: expect.any(Timestamp),
        })
      );
    });

    it('should set endDate to current timestamp', async () => {
      const costId = 'test-id-456';
      const beforeDeactivate = Timestamp.now();

      await store.deactivateFixedCost(costId);

      const afterDeactivate = Timestamp.now();
      const calls = firestoreSpy.updateDocument.mock.calls;
      const callArgs = calls[calls.length - 1][2] as { endDate: Timestamp };

      expect(callArgs.endDate instanceof Timestamp).toBe(true);
      expect(callArgs.endDate.seconds).toBeGreaterThanOrEqual(beforeDeactivate.seconds);
      expect(callArgs.endDate.seconds).toBeLessThanOrEqual(afterDeactivate.seconds);
    });

    it('should propagate errors from firestore', async () => {
      const error = new Error('Firestore error');
      firestoreSpy.updateDocument.mockReturnValue(Promise.reject(error));

      await expect(store.deactivateFixedCost('test-id')).rejects.toBe(error);
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
      const input = { name: 'Test Cost', description: '', amount: 100, frequency: 'monthly' as const, category: 'utilities' as const, active: true };
      firestoreSpy.addDocument.mockResolvedValue('new-id');

      await store.createFixedCost(input);

      const calls = firestoreSpy.addDocument.mock.calls;
      const callArgs = calls[calls.length - 1][1] as { active: boolean; startDate: Timestamp; endDate: null };
      expect(callArgs.active).toBe(true);
      expect(callArgs.startDate instanceof Timestamp).toBe(true);
      expect(callArgs.endDate).toBeNull();
    });
  });
});
