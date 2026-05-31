import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { StockService } from './stock.service';
import { Sale, SaleInput } from '../models/sale';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private fs = inject(FirestoreService);
  private stockService = inject(StockService);

  async registerSale(sale: SaleInput): Promise<string> {
    this.stockService.validateStockForCreation(sale.items);

    const saleId = await this.fs.addDocument<SaleInput>('sales', sale);

    const adjustments = this.stockService.buildStockAdjustments(sale.items, -1);
    await this.fs.applyStockAdjustments(saleId, 'sale_deduction', adjustments);

    return saleId;
  }

  async updateSale(id: string, updatedSale: SaleInput, oldSale: Sale | undefined): Promise<void> {
    if (oldSale && JSON.stringify(oldSale.items) !== JSON.stringify(updatedSale.items)) {
      this.stockService.validateStockForEdition(oldSale.items, updatedSale.items);

      const oldAdjustments = this.stockService.buildStockAdjustments(oldSale.items, 1);
      await this.fs.applyStockAdjustments(id, 'edit_restock', oldAdjustments);

      const newAdjustments = this.stockService.buildStockAdjustments(updatedSale.items, -1);
      await this.fs.applyStockAdjustments(id, 'edit_deduction', newAdjustments);
    }

    await this.fs.updateDocument('sales', id, {
      items: updatedSale.items,
      total: updatedSale.total,
      totalCost: updatedSale.totalCost,
      profit: updatedSale.profit,
      deliveryDate: updatedSale.deliveryDate ?? null,
      customerId: updatedSale.customerId,
      customerName: updatedSale.customerName,
      isPaid: updatedSale.isPaid ?? false,
      paymentMethod: updatedSale.paymentMethod,
      notes: updatedSale.notes,
    });
  }

  async updateSaleStatus(id: string, status: Sale['status'], sale: Sale | undefined): Promise<void> {
    await this.fs.updateDocument('sales', id, { status });

    if (status === 'cancelled' && sale) {
      const adjustments = this.stockService.buildStockAdjustments(sale.items, 1);
      await this.fs.applyStockAdjustments(id, 'cancellation_restock', adjustments);
    }
  }
}
