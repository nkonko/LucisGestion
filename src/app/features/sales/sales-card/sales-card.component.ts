import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';
import { UiIconComponent } from '../../../shared/ui/components';
import type { Sale, SaleStatus } from '../../../core/models/sale';
import { SALE_STATUS_CLASS, SALE_STATUS_DISPLAY } from '../../../core/models/sale';

@Component({
  selector: 'app-sales-card',
  imports: [DatePipe, ArsPipe, UiIconComponent],
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

  requestWhatsApp(): void {
    this.whatsappRequested.emit(this.sale());
  }

  requestStatusChange(status: SaleStatus): void {
    this.statusChangeRequested.emit({ sale: this.sale(), status });
  }
}
