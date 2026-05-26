import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { IngredientsStore } from './ingredients.store';
import { FirestoreService } from '../services/firestore.service';

describe('IngredientsStore', () => {
  let store: InstanceType<typeof IngredientsStore>;
  let firestore: {
    getCollection: ReturnType<typeof vi.fn>;
    addDocument: ReturnType<typeof vi.fn>;
    updateDocument: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    firestore = {
      getCollection: vi.fn().mockReturnValue(
        of([
          {
            id: 'ing-1',
            name: 'Azúcar',
            category: 'sugars',
            unit: 'kg',
            unitPrice: 5,
            currentStock: 10,
            minimumStock: 2,
            lastPurchase: null,
            active: true,
          },
        ]),
      ),
      addDocument: vi.fn().mockResolvedValue('new-id'),
      updateDocument: vi.fn().mockResolvedValue(undefined),
      softDelete: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [IngredientsStore, { provide: FirestoreService, useValue: firestore }],
    });

    store = TestBed.inject(IngredientsStore);
  });

  it('creates ingredient as active', async () => {
    await store.createIngredient({
      name: 'Leche',
      category: 'dairy',
      unit: 'lt',
      unitPrice: 10,
      currentStock: 2,
      minimumStock: 1,
      lastPurchase: Timestamp.now(),
      active: false,
    });

    expect(firestore.addDocument).toHaveBeenCalledWith('ingredients', expect.objectContaining({ active: true }));
  });

  it('updates ingredient and registers price history when unit price changes', async () => {
    await store.updateIngredient('ing-1', { unitPrice: 7 });

    expect(firestore.updateDocument).toHaveBeenCalledWith('ingredients', 'ing-1', { unitPrice: 7 });
    expect(firestore.addDocument).toHaveBeenCalledWith(
      'priceHistory',
      expect.objectContaining({ ingredientId: 'ing-1', previousPrice: 5, newPrice: 7 }),
    );
  });

  it('soft deletes ingredient', async () => {
    await store.deleteIngredient('ing-1');
    expect(firestore.softDelete).toHaveBeenCalledWith('ingredients', 'ing-1');
  });

  it('registers supply purchase, updates stock and creates stock movement', async () => {
    const expense = {
      date: Timestamp.now(),
      description: 'Compra semanal',
      supplier: 'Proveedor',
      total: 120,
      items: [{ ingredientId: 'ing-1', name: 'Azúcar', quantity: 3, unitPrice: 8, totalPrice: 24 }],
    };

    await store.registerSupplyPurchase(expense);

    expect(firestore.addDocument).toHaveBeenCalledWith('supplyExpenses', expense);
    expect(firestore.updateDocument).toHaveBeenCalledWith('ingredients', 'ing-1', expect.objectContaining({ currentStock: 13, unitPrice: 8 }));
    expect(firestore.addDocument).toHaveBeenCalledWith('stockMovements', expect.objectContaining({ ingredientId: 'ing-1', type: 'purchase', quantity: 3 }));
  });
});
