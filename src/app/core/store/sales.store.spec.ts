import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { SalesStore } from './sales.store';
import { FirestoreService } from '../services/firestore.service';
import { IngredientsStore } from './ingredients.store';
import { RecipesStore } from './recipes.store';
import { Sale, SaleInput } from '../models/sale';

describe('SalesStore', () => {
  let store: InstanceType<typeof SalesStore>;
  let sales$: BehaviorSubject<Sale[]>;
  let firestore: {
    getCollection: ReturnType<typeof vi.fn>;
    addDocument: ReturnType<typeof vi.fn>;
    updateDocument: ReturnType<typeof vi.fn>;
    applyStockAdjustments: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    sales$ = new BehaviorSubject<Sale[]>([]);
    firestore = {
      getCollection: vi.fn().mockReturnValue(sales$.asObservable()),
      addDocument: vi.fn().mockResolvedValue('sale-1'),
      updateDocument: vi.fn().mockResolvedValue(undefined),
      applyStockAdjustments: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        SalesStore,
        { provide: FirestoreService, useValue: firestore },
        { provide: IngredientsStore, useValue: { ingredients: () => [{ id: 'ing-1', name: 'Harina' }] } },
        { provide: RecipesStore, useValue: { recipes: () => [{ id: 'rec-1', ingredients: [{ ingredientId: 'ing-1', name: 'Harina', quantity: 2, unit: 'kg' }] }] } },
      ],
    });

    store = TestBed.inject(SalesStore);
  });

  it('registers a sale and applies stock deduction', async () => {
    const sale: SaleInput = {
      date: Timestamp.now(),
      customerId: null,
      customerName: 'CF',
      items: [{ recipeId: 'rec-1', name: 'Torta', quantity: 3, unitPrice: 100, unitCost: 50 }],
      total: 300,
      totalCost: 150,
      profit: 150,
      paymentMethod: 'cash',
      status: 'pending',
      notes: '',
    };

    const id = await store.registerSale(sale);

    expect(id).toBe('sale-1');
    expect(firestore.addDocument).toHaveBeenCalledWith('sales', sale);
    expect(firestore.applyStockAdjustments).toHaveBeenCalledWith('sale-1', 'sale_deduction', [
      { ingredientId: 'ing-1', ingredientName: 'Harina', delta: -6 },
    ]);
  });

  it('cancels a sale and restores stock', async () => {
    sales$.next([
      {
        id: 'sale-1',
        date: Timestamp.now(),
        customerId: null,
        customerName: 'CF',
        items: [{ recipeId: 'rec-1', name: 'Torta', quantity: 2, unitPrice: 100, unitCost: 40 }],
        total: 200,
        totalCost: 80,
        profit: 120,
        paymentMethod: 'cash',
        status: 'pending',
        notes: '',
      },
    ]);

    await store.updateSaleStatus('sale-1', 'cancelled');

    expect(firestore.updateDocument).toHaveBeenCalledWith('sales', 'sale-1', { status: 'cancelled' });
    expect(firestore.applyStockAdjustments).toHaveBeenCalledWith('sale-1', 'cancellation_restock', [
      { ingredientId: 'ing-1', ingredientName: 'Harina', delta: 4 },
    ]);
  });
});
