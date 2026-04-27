import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { NgTemplateOutlet, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { SalesStore } from '../../core/store/sales.store';
import { CustomersStore } from '../../core/store/customers.store';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { SALE_STATUS_CLASS } from '../../core/models/sale/sale-status.model';
import type { SaleStatus } from '../../core/models/sale/sale-status.model';
import { Sale, SALE_STATUS_DISPLAY } from '../../core/models/sale';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { SaleFormComponent } from './sale-form.component';

@Component({
  selector: 'app-sales',
  imports: [
    NgTemplateOutlet,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTabsModule,
    MatDialogModule,
    ArsPipe,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './sales.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesComponent {
  readonly store = inject(SalesStore);
  private customersStore = inject(CustomersStore);
  private whatsApp = inject(WhatsAppService);
  private dialog = inject(MatDialog);
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

  getStatusClass(status: SaleStatus): string {
    return SALE_STATUS_CLASS[status];
  }

  getStatusLabel(status: SaleStatus): string {
    return SALE_STATUS_DISPLAY[status];
  }

  newSale() {
    const dialogRef = this.dialog.open(SaleFormComponent, {
      width: '100%',
      maxWidth: '560px',
      maxHeight: '90vh',
      data: null,
    });

    dialogRef.afterClosed().subscribe(async (result: Sale | undefined) => {
      if (result) {
        await this.store.registerSale(result);
        this.notify.success('Venta registrada. Stock actualizado.', 3000);
      }
    });
  }

  async changeStatus(sale: Sale, newStatus: Sale['status']) {
    await this.store.updateSaleStatus(sale.id!, newStatus);
    this.notify.success(`Pedido marcado como ${this.getStatusLabel(newStatus).toLowerCase()}`);
  }

  sendWhatsApp(sale: Sale) {
    const customer = this.customersStore.customers().find((c) => c.id === sale.customerId);
    const items = sale.items.map((i) => `${i.quantity}x ${i.name}`).join('\n');
    const msg = `Hola ${sale.customerName}! 🧁\n\nTu pedido de Lucis Pastelería:\n${items}\n\nTotal: $${sale.total}\n\n¡Gracias!`;
    this.whatsApp.sendMessage(customer?.phone ?? '', msg);
  }
}
