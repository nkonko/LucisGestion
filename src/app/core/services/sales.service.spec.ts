import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { SalesService } from './sales.service';
import { FirestoreService } from './firestore.service';
import { StockService } from './stock.service';
import { SaleInput, Sale } from '../models/sale';
import { StockAdjustmentInput } from '../models/stock';

describe('SalesService', () => {
  let service: SalesService;
  let firestore: {
    addDocument: ReturnType<typeof vi.fn>;
    updateDocument: ReturnType<typeof vi.fn>;
    applyStockAdjustments: ReturnType<typeof vi.fn>;
  };
  let stockService: {
    validateStockForCreation: ReturnType<typeof vi.fn>;
    validateStockForEdition: ReturnType<typeof vi.fn>;
    buildStockAdjustments: ReturnType<typeof vi.fn>;
  };

  const saleInput: SaleInput = {
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
  };

  beforeEach(() => {
    firestore = {
      addDocument: vi.fn().mockResolvedValue('sale-1'),
      updateDocument: vi.fn().mockResolvedValue(undefined),
      applyStockAdjustments: vi.fn().mockResolvedValue(undefined),
    };
    stockService = {
      validateStockForCreation: vi.fn(),
      validateStockForEdition: vi.fn(),
      buildStockAdjustments: vi.fn().mockReturnValue([]),
    };

    TestBed.configureTestingModule({
      providers: [
        SalesService,
        { provide: FirestoreService, useValue: firestore },
        { provide: StockService, useValue: stockService },
      ],
    });

    service = TestBed.inject(SalesService);
  });

  describe('registerSale', () => {
    it('creates pending sale with stock deduction when stock is sufficient', async () => {
      const adjustments: StockAdjustmentInput[] = [
        { ingredientId: 'ing-1', ingredientName: 'Harina', delta: -4 },
      ];
      stockService.buildStockAdjustments.mockReturnValue(adjustments);

      const result = await service.registerSale(saleInput);

      expect(stockService.validateStockForCreation).toHaveBeenCalledWith(saleInput.items);
      expect(firestore.addDocument).toHaveBeenCalledWith('sales', saleInput);
      expect(stockService.buildStockAdjustments).toHaveBeenCalledWith(saleInput.items, -1);
      expect(firestore.applyStockAdjustments).toHaveBeenCalledWith('sale-1', 'sale_deduction', adjustments);
      expect(result).toEqual({ saleId: 'sale-1', wasDraft: false });
    });

    it('creates draft sale skipping stock deduction when stock is insufficient', async () => {
      stockService.validateStockForCreation.mockImplementation(() => {
        throw new Error('Stock insuficiente');
      });

      const result = await service.registerSale(saleInput);

      expect(firestore.addDocument).toHaveBeenCalledWith('sales', expect.objectContaining({ status: 'draft' }));
      expect(stockService.buildStockAdjustments).not.toHaveBeenCalled();
      expect(firestore.applyStockAdjustments).not.toHaveBeenCalled();
      expect(result).toEqual({ saleId: 'sale-1', wasDraft: true });
    });

    it('propagates error when addDocument fails', async () => {
      firestore.addDocument.mockRejectedValue(new Error('Network error'));

      await expect(service.registerSale(saleInput)).rejects.toThrow('Network error');
    });
  });

  describe('updateSale', () => {
    const oldSale: Sale = {
      id: 'sale-1',
      ...saleInput,
    };

    it('validates and adjusts stock when items change', async () => {
      const updatedItems = [{ recipeId: 'rec-1', name: 'Torta', quantity: 3, unitPrice: 100, unitCost: 40 }];
      const updatedSale = { ...saleInput, items: updatedItems };
      const restockAdjustments: StockAdjustmentInput[] = [
        { ingredientId: 'ing-1', ingredientName: 'Harina', delta: 4 },
      ];
      const deductAdjustments: StockAdjustmentInput[] = [
        { ingredientId: 'ing-1', ingredientName: 'Harina', delta: -6 },
      ];
      stockService.buildStockAdjustments
        .mockReturnValueOnce(restockAdjustments)
        .mockReturnValueOnce(deductAdjustments);

      await service.updateSale('sale-1', updatedSale, oldSale);

      expect(stockService.validateStockForEdition).toHaveBeenCalledWith(saleInput.items, updatedItems);
      expect(stockService.buildStockAdjustments).toHaveBeenCalledWith(saleInput.items, 1);
      expect(firestore.applyStockAdjustments).toHaveBeenCalledWith('sale-1', 'edit_restock', restockAdjustments);
      expect(stockService.buildStockAdjustments).toHaveBeenCalledWith(updatedItems, -1);
      expect(firestore.applyStockAdjustments).toHaveBeenCalledWith('sale-1', 'edit_deduction', deductAdjustments);
      expect(firestore.updateDocument).toHaveBeenCalledWith('sales', 'sale-1', expect.objectContaining({ items: updatedItems }));
    });

    it('only updates document when items are unchanged', async () => {
      await service.updateSale('sale-1', saleInput, oldSale);

      expect(stockService.validateStockForEdition).not.toHaveBeenCalled();
      expect(stockService.buildStockAdjustments).not.toHaveBeenCalled();
      expect(firestore.updateDocument).toHaveBeenCalled();
    });

    it('only updates document when no old sale is provided', async () => {
      await service.updateSale('sale-1', saleInput, undefined);

      expect(stockService.validateStockForEdition).not.toHaveBeenCalled();
      expect(stockService.buildStockAdjustments).not.toHaveBeenCalled();
      expect(firestore.updateDocument).toHaveBeenCalled();
    });

    it('includes customerId and other fields in document update', async () => {
      await service.updateSale('sale-1', saleInput, oldSale);

      expect(firestore.updateDocument).toHaveBeenCalledWith(
        'sales', 'sale-1',
        expect.objectContaining({
          customerId: saleInput.customerId,
          customerName: saleInput.customerName,
          total: saleInput.total,
          totalCost: saleInput.totalCost,
          profit: saleInput.profit,
          isPaid: false,
          notes: saleInput.notes,
        }),
      );
    });

    it('forces draft when stock validation fails on edition', async () => {
      const updatedItems = [{ recipeId: 'rec-1', name: 'Torta', quantity: 10, unitPrice: 100, unitCost: 40 }];
      const updatedSale = { ...saleInput, items: updatedItems };
      const restockAdjustments: StockAdjustmentInput[] = [
        { ingredientId: 'ing-1', ingredientName: 'Harina', delta: 4 },
      ];
      stockService.buildStockAdjustments.mockReturnValue(restockAdjustments);
      stockService.validateStockForEdition.mockImplementation(() => {
        throw new Error('Stock insuficiente');
      });

      const result = await service.updateSale('sale-1', updatedSale, oldSale);

      expect(stockService.validateStockForEdition).toHaveBeenCalledWith(saleInput.items, updatedItems);
      expect(stockService.buildStockAdjustments).toHaveBeenCalledWith(saleInput.items, 1);
      expect(firestore.applyStockAdjustments).toHaveBeenCalledWith('sale-1', 'edit_restock', restockAdjustments);
      expect(firestore.updateDocument).toHaveBeenCalledWith('sales', 'sale-1', expect.objectContaining({ status: 'draft', items: updatedItems }));
      expect(result).toEqual({ forcedDraft: true });
    });

    it('edits draft sale without stock operations', async () => {
      const draftOldSale: Sale = { ...oldSale, status: 'draft' };
      const updatedItems = [{ recipeId: 'rec-1', name: 'Torta', quantity: 3, unitPrice: 100, unitCost: 40 }];
      const updatedSale = { ...saleInput, items: updatedItems };

      const result = await service.updateSale('sale-1', updatedSale, draftOldSale);

      expect(stockService.validateStockForEdition).not.toHaveBeenCalled();
      expect(stockService.buildStockAdjustments).not.toHaveBeenCalled();
      expect(firestore.applyStockAdjustments).not.toHaveBeenCalled();
      expect(firestore.updateDocument).toHaveBeenCalledWith('sales', 'sale-1', expect.objectContaining({ items: updatedItems }));
      expect(result).toEqual({ forcedDraft: false });
    });
  });

  describe('fulfillDraft', () => {
    const draftSale: Sale = {
      id: 'sale-1',
      ...saleInput,
      status: 'draft',
    };

    it('validates stock, deducts, and updates status to pending when stock is sufficient', async () => {
      const adjustments: StockAdjustmentInput[] = [
        { ingredientId: 'ing-1', ingredientName: 'Harina', delta: -4 },
      ];
      stockService.buildStockAdjustments.mockReturnValue(adjustments);

      await service.fulfillDraft('sale-1', draftSale);

      expect(stockService.validateStockForCreation).toHaveBeenCalledWith(draftSale.items);
      expect(stockService.buildStockAdjustments).toHaveBeenCalledWith(draftSale.items, -1);
      expect(firestore.applyStockAdjustments).toHaveBeenCalledWith('sale-1', 'sale_deduction', adjustments);
      expect(firestore.updateDocument).toHaveBeenCalledWith('sales', 'sale-1', { status: 'pending' });
    });

    it('throws error when stock is still insufficient', async () => {
      stockService.validateStockForCreation.mockImplementation(() => {
        throw new Error('Stock insuficiente');
      });

      await expect(service.fulfillDraft('sale-1', draftSale)).rejects.toThrow('Stock insuficiente');
      expect(stockService.buildStockAdjustments).not.toHaveBeenCalled();
      expect(firestore.applyStockAdjustments).not.toHaveBeenCalled();
      expect(firestore.updateDocument).not.toHaveBeenCalled();
    });
  });

  describe('updateSaleStatus', () => {
    const sale: Sale = {
      id: 'sale-1',
      ...saleInput,
    };

    it('updates document status and restocks when cancelled', async () => {
      const adjustments: StockAdjustmentInput[] = [
        { ingredientId: 'ing-1', ingredientName: 'Harina', delta: 4 },
      ];
      stockService.buildStockAdjustments.mockReturnValue(adjustments);

      await service.updateSaleStatus('sale-1', 'cancelled', sale);

      expect(firestore.updateDocument).toHaveBeenCalledWith('sales', 'sale-1', { status: 'cancelled' });
      expect(stockService.buildStockAdjustments).toHaveBeenCalledWith(sale.items, 1);
      expect(firestore.applyStockAdjustments).toHaveBeenCalledWith('sale-1', 'cancellation_restock', adjustments);
    });

    it('does not restock when status is not cancelled', async () => {
      await service.updateSaleStatus('sale-1', 'delivered', sale);

      expect(firestore.updateDocument).toHaveBeenCalledWith('sales', 'sale-1', { status: 'delivered' });
      expect(stockService.buildStockAdjustments).not.toHaveBeenCalled();
      expect(firestore.applyStockAdjustments).not.toHaveBeenCalled();
    });

    it('does not restock when cancelled but no sale provided', async () => {
      await service.updateSaleStatus('sale-1', 'cancelled', undefined);

      expect(firestore.updateDocument).toHaveBeenCalledWith('sales', 'sale-1', { status: 'cancelled' });
      expect(stockService.buildStockAdjustments).not.toHaveBeenCalled();
      expect(firestore.applyStockAdjustments).not.toHaveBeenCalled();
    });

    it('does not restock when cancelling a draft sale', async () => {
      const draftSale: Sale = { ...sale, status: 'draft' };

      await service.updateSaleStatus('sale-1', 'cancelled', draftSale);

      expect(firestore.updateDocument).toHaveBeenCalledWith('sales', 'sale-1', { status: 'cancelled' });
      expect(stockService.buildStockAdjustments).not.toHaveBeenCalled();
      expect(firestore.applyStockAdjustments).not.toHaveBeenCalled();
    });
  });
});
