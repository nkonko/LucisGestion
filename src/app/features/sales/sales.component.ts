import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { SalesStore } from '../../core/store/sales.store';
import { CustomersStore } from '../../core/store/customers.store';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import type { SaleStatus } from '../../core/models/sale/sale-status.model';
import { Sale, SaleInput, SALE_STATUS_DISPLAY } from '../../core/models/sale';
import { SaleFormComponent } from './create-sale/sale-form.component';
import { BottomSheetService } from '../../core/services/bottom-sheet.service';
import { UiIconComponent } from '../../shared/ui/components';
import { SalesCardComponent } from './sales-card/sales-card.component';
import { ConfirmBottomSheetDialogComponent } from '../../shared/ui-bottom-sheet/confirm-dialog/confirm-bottom-sheet-dialog.component';
import { ConfirmDialogData } from '../../shared/ui-bottom-sheet/confirm-dialog/confirm-dialog-data.model';

@Component({
  selector: 'app-sales',
  imports: [UiIconComponent, SalesCardComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesComponent {
  private static readonly DELETED_CUSTOMER_NAME = '[eliminado]';

  readonly store = inject(SalesStore);
  private customersStore = inject(CustomersStore);
  private whatsApp = inject(WhatsAppService);
  private bottomSheet = inject(BottomSheetService);
  private notify = inject(NotificationService);

  statusDisplay: Record<SaleStatus, string> = SALE_STATUS_DISPLAY;

  searchTerm = signal('');
  dateFrom = signal<Date | null>(null);
  selectedCustomerId = signal<string | null>(null);
  selectedStatus = signal<SaleStatus | null>(null);
  selectedPaymentStatus = signal<'paid' | 'unpaid' | null>(null);

  readonly customers = computed(() =>
    this.customersStore
      .customers()
      .filter((customer) => customer.name !== SalesComponent.DELETED_CUSTOMER_NAME),
  );
  private readonly customersById = computed(() => new Map(this.customers().map((customer) => [customer.id, customer])));
  readonly dateFromValue = computed(() => {
    const date = this.dateFrom();
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  });

  readonly hasActiveFilters = computed(
    () =>
      Boolean(this.searchTerm().trim()) ||
      this.dateFrom() !== null ||
      this.selectedCustomerId() !== null ||
        this.selectedStatus() !== null ||
        this.selectedPaymentStatus() !== null,
  );

  filteredSales = computed(() => {
    let items = this.store.sales();
    const term = this.searchTerm().toLowerCase().trim();
    const from = this.dateFrom();
    const customerId = this.selectedCustomerId();
    const status = this.selectedStatus();
    const paymentStatus = this.selectedPaymentStatus();

    if (term) {
      items = items.filter(
        (v) =>
          v.customerName.toLowerCase().includes(term) ||
          v.items.some((i) => i.name.toLowerCase().includes(term)),
      );
    }
    if (from) {
      items = items.filter((v) => v.date?.toDate() >= from);
    }
    if (customerId) {
      items = items.filter((v) => v.customerId === customerId);
    }
    if (status) {
      items = items.filter((v) => v.status === status);
    }
    if (paymentStatus) {
      items = items.filter((v) => (paymentStatus === 'paid' ? v.isPaid === true : v.isPaid !== true));
    }

    items = items.map((sale) => {
      const customerFromStore = sale.customerId ? this.customersById().get(sale.customerId) : undefined;
      const normalizedCustomerName =
        customerFromStore?.name ??
        (sale.customerName === SalesComponent.DELETED_CUSTOMER_NAME ? '' : sale.customerName);

      return { ...sale, customerName: normalizedCustomerName };
    });

    if (!this.hasActiveFilters()) {
      const statusPriority: Record<SaleStatus, number> = {
        draft: 0,
        pending: 1,
        production: 2,
        delivered: 3,
        cancelled: 4,
      };

      return [...items].sort((a, b) => {
        const statusDiff = statusPriority[a.status] - statusPriority[b.status];
        if (statusDiff !== 0) return statusDiff;
        return b.date.toMillis() - a.date.toMillis();
      });
    }

    return items;
  });

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.searchTerm.set(value);
  }

  onDateFromInput(event: Event): void {
    const htmlTarget = event.target as HTMLInputElement | null;
    const value = htmlTarget?.value ?? '';
    this.dateFrom.set(value ? new Date(`${value}T00:00:00`) : null);
  }

  onCustomerFilterChange(event: Event): void {
    const htmlTarget = event.target as HTMLSelectElement | null;
    const value = htmlTarget?.value ?? '';
    this.selectedCustomerId.set(value ? value : null);
  }

  onStatusFilterChange(event: Event): void {
    const htmlTarget = event.target as HTMLSelectElement | null;
    this.selectedStatus.set(this.validateStatus(htmlTarget?.value ?? ''));
  }

  onPaymentStatusFilterChange(event: Event): void {
    const htmlTarget = event.target as HTMLSelectElement | null;
    this.selectedPaymentStatus.set(this.validatePaymentStatus(htmlTarget?.value ?? ''));
  }

  private validateStatus(rawValue: string): SaleStatus | null {
    const value = rawValue.trim();
    const validStatuses: SaleStatus[] = ['draft', 'pending', 'production', 'delivered', 'cancelled'];
    return validStatuses.includes(value as SaleStatus) ? (value as SaleStatus) : null;
  }

  private validatePaymentStatus(rawValue: string): 'paid' | 'unpaid' | null {
    const value = rawValue.trim();
    return value === 'paid' ? 'paid' : value === 'unpaid' ? 'unpaid' : null;
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.dateFrom.set(null);
    this.selectedCustomerId.set(null);
    this.selectedStatus.set(null);
    this.selectedPaymentStatus.set(null);
  }

  newSale(): void {
    const dialogRef = this.bottomSheet.open<null, SaleInput>(SaleFormComponent, {
      title: 'Nueva Venta',
      section: 'Venta',
      maxWidth: '760px',
      maxHeight: '90vh',
      data: null,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result) {
        try {
          const { wasDraft } = await this.store.registerSale(result);
          if (wasDraft) {
            this.notify.info('Venta registrada como borrador — stock pendiente.', 4000);
          } else {
            this.notify.success('Venta registrada. Stock actualizado.', 3000);
          }
        } catch (error: unknown) {
          this.notify.errorFrom(error, 'No se pudo registrar la venta.');
        }
      }
    });
  }

  editSale(sale: Sale): void {
    const saleId = sale.id;
    if (!saleId) {
      this.notify.error('Venta inválida.');
      return;
    }

    const dialogRef = this.bottomSheet.open<Sale, SaleInput>(SaleFormComponent, {
      title: 'Editar Venta',
      section: 'Venta',
      maxWidth: '760px',
      maxHeight: '90vh',
      data: sale,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result) {
        try {
          const { forcedDraft } = await this.store.updateSale(saleId, result);
          if (forcedDraft) {
            this.notify.info('Venta movida a borrador por stock insuficiente.', 4000);
          } else {
            this.notify.success('Venta actualizada.', 3000);
          }
        } catch (error: unknown) {
          this.notify.errorFrom(error, 'No se pudo actualizar la venta.');
        }
      }
    });
  }

  async toggleSalePaid(sale: Sale): Promise<void> {
    const saleId = sale.id;
    if (!saleId) {
      this.notify.error('Venta inválida.');
      return;
    }

    try {
      await this.store.toggleSalePaid(saleId);
      const label = !sale.isPaid ? 'pagada' : 'marcada como no pagada';
      this.notify.success(`Venta ${label}.`, 3000);
    } catch (error: unknown) {
      this.notify.errorFrom(error, 'No se pudo actualizar el estado de pago.');
    }
  }

  async fulfillDraft(sale: Sale): Promise<void> {
    const saleId = sale.id;
    if (!saleId) {
      this.notify.error('Venta inválida.');
      return;
    }

    const confirmed = await this.confirmFulfillDraft(sale);
    if (!confirmed) return;

    try {
      await this.store.fulfillDraft(saleId);
      this.notify.success('Venta confirmada. Stock actualizado.', 3000);
    } catch (error: unknown) {
      this.notify.errorFrom(error, 'Stock insuficiente para completar la venta.');
    }
  }

  async changeStatus(sale: Sale, newStatus: Sale['status']): Promise<void> {
    const saleId = sale.id;
    if (!saleId) {
      this.notify.error('Venta inválida.');
      return;
    }

    if (newStatus === 'cancelled') {
      const confirmed = await this.confirmCancelSale(sale);
      if (!confirmed) return;
    }

    await this.store.updateSaleStatus(saleId, newStatus);

    const statusLabel = (() => {
      switch (newStatus) {
        case 'draft':
          return 'Borrador';
        case 'pending':
          return 'Pendiente';
        case 'production':
          return 'En Producción';
        case 'delivered':
          return 'Entregado';
        case 'cancelled':
          return 'Cancelado';
      }
    })();

    this.notify.success(`Pedido marcado como ${statusLabel.toLowerCase()}`);
  }

  private confirmCancelSale(sale: Sale): Promise<boolean> {
    return new Promise((resolve) => {
      const ref = this.bottomSheet.open<ConfirmDialogData, boolean>(
        ConfirmBottomSheetDialogComponent,
        {
          maxWidth: '420px',
          data: {
            title: 'Cancelar venta',
            message: `¿Seguro que querés cancelar la venta de ${sale.customerName} por $${sale.total}? Esta acción no se puede deshacer desde la app.`,
            confirmLabel: 'Cancelar venta',
            destructive: true,
          },
        },
      );
      ref.afterClosed.subscribe((confirmed) => resolve(confirmed === true));
    });
  }

  private confirmFulfillDraft(sale: Sale): Promise<boolean> {
    return new Promise((resolve) => {
      const ref = this.bottomSheet.open<ConfirmDialogData, boolean>(
        ConfirmBottomSheetDialogComponent,
        {
          maxWidth: '420px',
          data: {
            title: 'Confirmar venta',
            message: `¿Confirmás la venta de ${sale.customerName} por $${sale.total}? Se descontarán los ingredientes del stock.`,
            confirmLabel: 'Confirmar venta',
          },
        },
      );
      ref.afterClosed.subscribe((confirmed) => resolve(confirmed === true));
    });
  }

  sendWhatsApp(sale: Sale): void {
    const customer = this.customersStore.customers().find((c) => c.id === sale.customerId);
    const items = sale.items.map((i) => `${i.quantity}x ${i.name}`).join('\n');
    const customerName = sale.customerName.trim() || customer?.name || 'cliente';
    const msg = `Hola ${customerName}! 🧁\n\nTu pedido de Lucis Pastelería:\n${items}\n\nTotal: $${sale.total}\n\n¡Gracias!`;
    this.whatsApp.sendMessage(customer?.phone ?? '', msg);
  }

  onStatusChange(event: { sale: Sale; status: SaleStatus }): void {
    void this.changeStatus(event.sale, event.status);
  }

  onEditRequested(sale: Sale): void {
    if (sale.status !== 'pending' && sale.status !== 'production' && sale.status !== 'draft') {
      this.notify.error('Solo se pueden modificar ventas pendientes, en producción o borradores.');
      return;
    }

    this.editSale(sale);
  }
}
