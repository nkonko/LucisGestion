import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { SalesStore } from './sales.store';
import { FirestoreService } from '../services/firestore.service';
import { SalesService } from '../services/sales.service';
import { Sale, SaleInput } from '../models/sale';

describe('SalesStore', () => {
  let store: InstanceType<typeof SalesStore>;
  let sales$: BehaviorSubject<Sale[]>;
  let firestore: {
    getCollection: ReturnType<typeof vi.fn>;
  };
  let salesService: {
    registerSale: ReturnType<typeof vi.fn>;
    updateSale: ReturnType<typeof vi.fn>;
    updateSaleStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    sales$ = new BehaviorSubject<Sale[]>([]);
    firestore = {
      getCollection: vi.fn().mockReturnValue(sales$.asObservable()),
    };
    salesService = {
      registerSale: vi.fn().mockResolvedValue('sale-1'),
      updateSale: vi.fn().mockResolvedValue(undefined),
      updateSaleStatus: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        SalesStore,
        { provide: FirestoreService, useValue: firestore },
        { provide: SalesService, useValue: salesService },
      ],
    });

    store = TestBed.inject(SalesStore);
  });

  it('registers a sale via SalesService', async () => {
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
    expect(salesService.registerSale).toHaveBeenCalledWith(sale);
  });

  it('updates sale status via SalesService', async () => {
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

    expect(salesService.updateSaleStatus).toHaveBeenCalledWith(
      'sale-1',
      'cancelled',
      expect.objectContaining({ id: 'sale-1' }),
    );
  });

  it('tracks loading state during operations', async () => {
    const sale: SaleInput = {
      date: Timestamp.now(),
      customerId: null,
      customerName: 'CF',
      items: [],
      total: 0,
      totalCost: 0,
      profit: 0,
      paymentMethod: 'cash',
      status: 'pending',
      notes: '',
    };

    const registerPromise = store.registerSale(sale);
    expect(store.loading()).toBe(true);

    await registerPromise;
    expect(store.loading()).toBe(false);
  });

  it('captures error on failure', async () => {
    salesService.registerSale.mockRejectedValue(new Error('Stock insuficiente'));

    const sale: SaleInput = {
      date: Timestamp.now(),
      customerId: null,
      customerName: 'CF',
      items: [],
      total: 0,
      totalCost: 0,
      profit: 0,
      paymentMethod: 'cash',
      status: 'pending',
      notes: '',
    };

    await expect(store.registerSale(sale)).rejects.toThrow('Stock insuficiente');
    expect(store.error()).toBe('Stock insuficiente');
    expect(store.loading()).toBe(false);
  });
});
