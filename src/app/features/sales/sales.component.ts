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

@Component({
  selector: 'app-sales',
  imports: [UiIconComponent, SalesCardComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesComponent {
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

  readonly customers = computed(() => this.customersStore.customers());
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

    if (!this.hasActiveFilters()) {
      const statusPriority: Record<SaleStatus, number> = {
        pending: 0,
        production: 1,
        delivered: 2,
        cancelled: 3,
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
    const htmlTarget = event.target as HTMLInputElement | null;
    this.searchTerm.set(htmlTarget?.value ?? '');
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
    const input = String(htmlTarget?.value ?? '');
    const validStatuses: SaleStatus[] = ['pending', 'production', 'delivered', 'cancelled'];
    const statusValue = validStatuses.includes(input as SaleStatus) ? (input as SaleStatus) : null;
    this.selectedStatus.set(statusValue);
  }

  onPaymentStatusFilterChange(event: Event): void {
    const htmlTarget = event.target as HTMLSelectElement | null;
    const input = String(htmlTarget?.value ?? '');
    const paymentStatusValue = input === 'paid' ? 'paid' : input === 'unpaid' ? 'unpaid' : null;
    this.selectedPaymentStatus.set(paymentStatusValue);
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
      maxWidth: '760px',
      maxHeight: '90vh',
      data: null,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result) {
        try {
          await this.store.registerSale(result);
          this.notify.success('Venta registrada. Stock actualizado.', 3000);
        } catch (error) {
          this.notify.errorFrom(error, 'No se pudo registrar la venta por stock insuficiente.');
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
      maxWidth: '760px',
      maxHeight: '90vh',
      data: sale,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result) {
        try {
          await this.store.updateSale(saleId, result);
          this.notify.success('Venta actualizada.', 3000);
        } catch (error) {
          this.notify.errorFrom(error, 'No se pudo actualizar la venta por stock insuficiente.');
        }
      }
    });
  }

  async changeStatus(sale: Sale, newStatus: Sale['status']): Promise<void> {
    const saleId = sale.id;
    if (!saleId) {
      this.notify.error('Venta inválida.');
      return;
    }

    await this.store.updateSaleStatus(saleId, newStatus);

    const statusLabel = (() => {
      switch (newStatus) {
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

  sendWhatsApp(sale: Sale): void {
    const customer = this.customersStore.customers().find((c) => c.id === sale.customerId);
    const items = sale.items.map((i) => `${i.quantity}x ${i.name}`).join('\n');
    const msg = `Hola ${sale.customerName}! 🧁\n\nTu pedido de Lucis Pastelería:\n${items}\n\nTotal: $${sale.total}\n\n¡Gracias!`;
    this.whatsApp.sendMessage(customer?.phone ?? '', msg);
  }

  onStatusChange(event: { sale: Sale; status: SaleStatus }): void {
    void this.changeStatus(event.sale, event.status);
  }

  onEditRequested(sale: Sale): void {
    if (sale.status !== 'pending' && sale.status !== 'production') {
      this.notify.error('Solo se pueden modificar ventas pendientes o en producción.');
      return;
    }

    this.editSale(sale);
  }
}
