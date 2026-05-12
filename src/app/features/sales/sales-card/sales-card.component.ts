import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';
import { UiIconComponent } from '../../../shared/ui/components';
import type { Sale, SaleStatus } from '../../../core/models/sale';
import { SALE_STATUS_CLASS, SALE_STATUS_DISPLAY } from '../../../core/models/sale';

@Component({
  selector: 'app-sales-card',
  imports: [ArsPipe, UiIconComponent],
  templateUrl: './sales-card.component.html',
  styleUrl: './sales-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesCardComponent {
  readonly sale = input.required<Sale>();

  readonly whatsappRequested = output<Sale>();
  readonly statusChangeRequested = output<{ sale: Sale; status: SaleStatus }>();

  get statusLabel(): string {
    return SALE_STATUS_DISPLAY[this.sale().status];
  }

  get statusClass(): string {
    return SALE_STATUS_CLASS[this.sale().status];
  }

  get displayDate(): string {
    const date = this.sale().date.toDate();
    const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date);
    const day = new Intl.DateTimeFormat('es-AR', { day: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(date);
    const year = new Intl.DateTimeFormat('es-AR', { year: 'numeric' }).format(date);

    return `${weekday} ${day} de ${month} de ${year}`;
  }

  requestWhatsApp(): void {
    this.whatsappRequested.emit(this.sale());
  }

  requestStatusChange(status: SaleStatus): void {
    this.statusChangeRequested.emit({ sale: this.sale(), status });
  }
}
