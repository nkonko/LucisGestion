import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { NgTemplateOutlet, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { NotificationService } from '../../core/services/notification.service';
import { SalesStore } from '../../core/store/sales.store';
import { CustomersStore } from '../../core/store/customers.store';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { SALE_STATUS_CLASS } from '../../core/models/sale/sale-status.model';
import type { SaleStatus } from '../../core/models/sale/sale-status.model';
import { Sale, SALE_STATUS_DISPLAY } from '../../core/models/sale';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { SaleFormComponent } from './sale-form.component';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-sales',
  imports: [NgTemplateOutlet, DatePipe, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatTabsModule, ArsPipe],
  templateUrl: './sales.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesComponent {
  readonly store = inject(SalesStore);
  private customersStore = inject(CustomersStore);
  private whatsApp = inject(WhatsAppService);
  private dialog = inject(DialogService);
  private notify = inject(NotificationService);

  statusDisplay: Record<SaleStatus, string> = SALE_STATUS_DISPLAY;

  pending = this.store.pendingOrders;

  searchTerm = signal('');
  dateFrom = signal<Date | null>(null);

  filteredHistory = computed(() => {
    let items = this.store.sales();
    const term = this.searchTerm().toLowerCase().trim();
    const from = this.dateFrom();

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
    return items;
  });

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(target?.value ?? '');
  }

  onDateFromInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const value = target?.value ?? '';
    this.dateFrom.set(value ? new Date(`${value}T00:00:00`) : null);
  }

  getStatusClass(status: SaleStatus): string {
    return SALE_STATUS_CLASS[status];
  }

  getStatusLabel(status: SaleStatus): string {
    return SALE_STATUS_DISPLAY[status];
  }

  newSale(): void {
    const dialogRef = this.dialog.open<null, Sale>(SaleFormComponent, {
      maxWidth: '560px',
      maxHeight: '90vh',
      data: null,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result) {
        await this.store.registerSale(result);
        this.notify.success('Venta registrada. Stock actualizado.', 3000);
      }
    });
  }

  async changeStatus(sale: Sale, newStatus: Sale['status']): Promise<void> {
    await this.store.updateSaleStatus(sale.id!, newStatus);
    this.notify.success(`Pedido marcado como ${this.getStatusLabel(newStatus).toLowerCase()}`);
  }

  sendWhatsApp(sale: Sale): void {
    const customer = this.customersStore.customers().find((c) => c.id === sale.customerId);
    const items = sale.items.map((i) => `${i.quantity}x ${i.name}`).join('\n');
    const msg = `Hola ${sale.customerName}! 🧁\n\nTu pedido de Lucis Pastelería:\n${items}\n\nTotal: $${sale.total}\n\n¡Gracias!`;
    this.whatsApp.sendMessage(customer?.phone ?? '', msg);
  }
}
