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
    fulfillDraft: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    sales$ = new BehaviorSubject<Sale[]>([]);
    firestore = {
      getCollection: vi.fn().mockReturnValue(sales$.asObservable()),
    };
    salesService = {
      registerSale: vi.fn().mockResolvedValue({ saleId: 'sale-1', wasDraft: false }),
      updateSale: vi.fn().mockResolvedValue({ forcedDraft: false }),
      updateSaleStatus: vi.fn().mockResolvedValue(undefined),
      fulfillDraft: vi.fn().mockResolvedValue(undefined),
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

  it('registers a sale via SalesService and returns compound result', async () => {
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

    const result = await store.registerSale(sale);

    expect(result).toEqual({ saleId: 'sale-1', wasDraft: false });
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

  it('fulfills a draft via SalesService', async () => {
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
        status: 'draft',
        notes: '',
      },
    ]);

    await store.fulfillDraft('sale-1');

    expect(salesService.fulfillDraft).toHaveBeenCalledWith(
      'sale-1',
      expect.objectContaining({ id: 'sale-1', status: 'draft' }),
    );
  });

  it('tracks loading state during fulfillDraft', async () => {
    sales$.next([
      {
        id: 'sale-1',
        date: Timestamp.now(),
        customerId: null,
        customerName: 'CF',
        items: [],
        total: 0,
        totalCost: 0,
        profit: 0,
        paymentMethod: 'cash',
        status: 'draft',
        notes: '',
      },
    ]);

    const fulfillPromise = store.fulfillDraft('sale-1');
    expect(store.loading()).toBe(true);

    await fulfillPromise;
    expect(store.loading()).toBe(false);
  });

  it('pendingOrders excludes draft sales', () => {
    sales$.next([
      {
        id: 'sale-draft',
        date: Timestamp.now(),
        customerId: null,
        customerName: 'Draft',
        items: [],
        total: 0,
        totalCost: 0,
        profit: 0,
        paymentMethod: 'cash',
        status: 'draft',
        notes: '',
      },
      {
        id: 'sale-pending',
        date: Timestamp.now(),
        customerId: null,
        customerName: 'Pending',
        items: [],
        total: 0,
        totalCost: 0,
        profit: 0,
        paymentMethod: 'cash',
        status: 'pending',
        notes: '',
      },
      {
        id: 'sale-production',
        date: Timestamp.now(),
        customerId: null,
        customerName: 'Production',
        items: [],
        total: 0,
        totalCost: 0,
        profit: 0,
        paymentMethod: 'cash',
        status: 'production',
        notes: '',
      },
    ]);

    expect(store.pendingOrders().length).toBe(1);
    expect(store.pendingOrders()[0].id).toBe('sale-pending');
    expect(store.pendingOrdersCount()).toBe(1);
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
