import { Injectable, inject } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { FirestoreService } from './firestore.service';
import { StockService } from './stock.service';
import { Sale, SaleInput, SaleStatus } from '../models/sale';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private firestoreService = inject(FirestoreService);
  private stockService = inject(StockService);

  async registerSale(sale: SaleInput): Promise<{ saleId: string; wasDraft: boolean }> {
    let isDraft = false;
    try {
      this.stockService.validateStockForCreation(sale.items);
    } catch {
      isDraft = true;
    }

    const saleToCreate: SaleInput = isDraft
      ? { ...sale, status: 'draft' as SaleStatus }
      : sale;

    const saleId = await this.firestoreService.addDocument<Omit<SaleInput, 'id'>>('sales', saleToCreate);

    if (!isDraft) {
      const adjustments = this.stockService.buildStockAdjustments(saleToCreate.items, -1);
      await this.firestoreService.applyStockAdjustments(saleId, 'sale_deduction', adjustments);
    }

    return { saleId, wasDraft: isDraft };
  }

  async updateSale(id: string, updatedSale: SaleInput, oldSale: Sale | undefined): Promise<{ forcedDraft: boolean }> {
    if (oldSale) {
      if (oldSale.status === 'draft') {
        // Draft edits are stock-neutral — just update fields
        await this.firestoreService.updateDocument('sales', id, {
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
        return { forcedDraft: false };
      }

      if (JSON.stringify(oldSale.items) !== JSON.stringify(updatedSale.items)) {
        try {
          this.stockService.validateStockForEdition(oldSale.items, updatedSale.items);
        } catch {
          // Insufficient stock — restore old deductions and force draft
          const oldAdjustments = this.stockService.buildStockAdjustments(oldSale.items, 1);
          await this.firestoreService.applyStockAdjustments(id, 'edit_restock', oldAdjustments);

          await this.firestoreService.updateDocument('sales', id, {
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
            status: 'draft',
          });
          return { forcedDraft: true };
        }

        // Normal path — restore old, deduct new
        const oldAdjustments = this.stockService.buildStockAdjustments(oldSale.items, 1);
        await this.firestoreService.applyStockAdjustments(id, 'edit_restock', oldAdjustments);

        const newAdjustments = this.stockService.buildStockAdjustments(updatedSale.items, -1);
        await this.firestoreService.applyStockAdjustments(id, 'edit_deduction', newAdjustments);
      }
    }

    await this.firestoreService.updateDocument('sales', id, {
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
    return { forcedDraft: false };
  }

  async fulfillDraft(id: string, sale: Sale): Promise<void> {
    this.stockService.validateStockForCreation(sale.items);

    const adjustments = this.stockService.buildStockAdjustments(sale.items, -1);
    await this.firestoreService.applyStockAdjustments(id, 'sale_deduction', adjustments);

    await this.firestoreService.updateDocument('sales', id, { status: 'pending' });
  }

  async toggleSalePaid(id: string, isPaid: boolean): Promise<void> {
    await this.firestoreService.updateDocument('sales', id, { isPaid });
  }

  async updateSaleStatus(
    id: string,
    status: Sale['status'],
    sale: Sale | undefined,
  ): Promise<void> {
    return Sentry.startSpan(
      {
        name: 'updateSaleStatus',
        op: 'transaction',
      },
      async () => {
        if (status === 'cancelled' && sale?.status === 'production') {
          throw new Error('No se puede cancelar una venta en producción.');
        }

        await this.firestoreService.updateDocument('sales', id, { status });

    if (status === 'cancelled' && sale && sale.status !== 'draft') {
      const adjustments = this.stockService.buildStockAdjustments(sale.items, 1);
      await this.firestoreService.applyStockAdjustments(id, 'cancellation_restock', adjustments);
    }
  }
  )}
}
