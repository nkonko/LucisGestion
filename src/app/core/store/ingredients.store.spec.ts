import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { IngredientsStore } from './ingredients.store';
import { FirestoreService } from '../services/firestore.service';

describe('IngredientsStore', () => {
  let store: InstanceType<typeof IngredientsStore>;
  let nextMockId: number;
  let firestore: {
    getCollection: ReturnType<typeof vi.fn>;
    addDocument: ReturnType<typeof vi.fn>;
    updateDocument: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
    createDocumentId: ReturnType<typeof vi.fn>;
    registerSupplyPurchaseAtomic: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 15));

    nextMockId = 0;

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
      createDocumentId: vi.fn(() => `mock-id-${++nextMockId}`),
      registerSupplyPurchaseAtomic: vi.fn().mockResolvedValue({ expenseId: 'mock-id-1', alreadyApplied: false }),
    };

    TestBed.configureTestingModule({
      providers: [IngredientsStore, { provide: FirestoreService, useValue: firestore }],
    });

    store = TestBed.inject(IngredientsStore);
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('registers price history even if the ingredients signal updates before the write resolves', async () => {
    const ingredientsSubject = new BehaviorSubject([
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
    ]);

    firestore.getCollection.mockImplementation((path: string) => {
      if (path === 'ingredients') {
        return ingredientsSubject.asObservable();
      }

      return of([]);
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [IngredientsStore, { provide: FirestoreService, useValue: firestore }],
    });
    store = TestBed.inject(IngredientsStore);

    firestore.updateDocument.mockImplementation(async (_path: string, id: string, changes: { unitPrice?: number }) => {
      ingredientsSubject.next([
        {
          id,
          name: 'Azúcar',
          category: 'sugars',
          unit: 'kg',
          unitPrice: changes.unitPrice ?? 5,
          currentStock: 10,
          minimumStock: 2,
          lastPurchase: null,
          active: true,
        },
      ]);
    });

    await store.updateIngredient('ing-1', { unitPrice: 9 });

    expect(firestore.addDocument).toHaveBeenCalledWith(
      'priceHistory',
      expect.objectContaining({ ingredientId: 'ing-1', previousPrice: 5, newPrice: 9 }),
    );
  });

  it('soft deletes ingredient', async () => {
    await store.deleteIngredient('ing-1');
    expect(firestore.softDelete).toHaveBeenCalledWith('ingredients', 'ing-1');
  });

  it('registers supply purchase via atomic operation', async () => {
    vi.setSystemTime(new Date(2026, 4, 15));
    const fixedDate = Timestamp.fromDate(new Date(2026, 4, 15));

    const expense = {
      date: fixedDate,
      description: 'Compra semanal',
      supplier: 'Proveedor',
      total: 120,
      items: [{ ingredientId: 'ing-1', name: 'Azúcar', quantity: 3, unitPrice: 8, totalPrice: 24 }],
    };

    await store.registerSupplyPurchase(expense);

    expect(firestore.createDocumentId).toHaveBeenCalledWith('supplyExpenses');
    expect(firestore.registerSupplyPurchaseAtomic).toHaveBeenCalledWith({
      expenseId: 'mock-id-1',
      date: fixedDate,
      description: expense.description,
      supplier: expense.supplier,
      total: expense.total,
      items: [
        {
          ingredientId: 'ing-1',
          ingredientName: 'Azúcar',
          quantity: 3,
          unitPrice: 8,
        },
      ],
    });
  });

  it('returns alreadyApplied when expense already exists', async () => {
    const fixedDate = Timestamp.fromDate(new Date(2026, 4, 15));

    firestore.registerSupplyPurchaseAtomic.mockResolvedValue({
      expenseId: 'mock-id-1',
      alreadyApplied: true,
    });

    const expense = {
      date: fixedDate,
      description: 'Compra duplicada',
      supplier: 'Proveedor',
      total: 50,
      items: [{ ingredientId: 'ing-1', name: 'Azúcar', quantity: 1, unitPrice: 8, totalPrice: 8 }],
    };

    const result = await store.registerSupplyPurchase(expense);

    expect(result).toBe('mock-id-1');
    expect(firestore.registerSupplyPurchaseAtomic).toHaveBeenCalled();
  });
});
