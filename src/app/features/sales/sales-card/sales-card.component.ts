import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';
import { UiCardComponent, UiIconComponent } from '../../../shared/ui/components';
import type { Sale, SaleStatus } from '../../../core/models/sale';
import { SALE_STATUS_CLASS, SALE_STATUS_DISPLAY } from '../../../core/models/sale';

@Component({
  selector: 'app-sales-card',
  imports: [ArsPipe, UiCardComponent, UiIconComponent],
  templateUrl: './sales-card.component.html',
  styleUrl: './sales-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesCardComponent {
  readonly sale = input.required<Sale>();

  readonly whatsappRequested = output<Sale>();
  readonly statusChangeRequested = output<{ sale: Sale; status: SaleStatus }>();
  readonly editRequested = output<Sale>();

  get statusLabel(): string {
    return SALE_STATUS_DISPLAY[this.sale().status];
  }

  get statusClass(): string {
    return SALE_STATUS_CLASS[this.sale().status];
  }

  get displayDate(): string {
    const date = this.sale().date.toDate();
    return this.formatLongDate(date);
  }

  get displayDeliveryDate(): string | null {
    const deliveryDate = this.sale().deliveryDate;
    if (!deliveryDate) return null;

    return this.formatLongDate(deliveryDate.toDate());
  }

  get hasNotes(): boolean {
    return this.sale().notes.trim().length > 0;
  }

  private formatLongDate(date: Date): string {
    const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date);
    const day = new Intl.DateTimeFormat('es-AR', { day: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(date);
    const year = new Intl.DateTimeFormat('es-AR', { year: 'numeric' }).format(date);

    return `${weekday} ${day} de ${month} de ${year}`;
  }

  requestEdit(): void {
    this.editRequested.emit(this.sale());
  }

  requestWhatsApp(): void {
    this.whatsappRequested.emit(this.sale());
  }

  requestStatusChange(status: SaleStatus): void {
    this.statusChangeRequested.emit({ sale: this.sale(), status });
  }

  getNextStatus(): SaleStatus | null {
    const status = this.sale().status;
    const transitions: Record<SaleStatus, SaleStatus | null> = {
      pending: 'production',
      production: 'delivered',
      delivered: null,
      cancelled: null,
    };
    return transitions[status];
  }
}
