import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SalesStore } from '../../../core/store/sales.store';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';
import { UiIconComponent } from '../../../shared/ui/components';
import { DemoModeService } from '../../../core/services/demo-mode.service';
import { SALE_STATUS_CLASS, SALE_STATUS_DISPLAY, type Sale, type SaleStatus } from '../../../core/models/sale';

@Component({
  selector: 'app-today-deliveries',
  imports: [RouterLink, ArsPipe, UiIconComponent],
  templateUrl: './today-deliveries.component.html',
  styleUrl: './today-deliveries.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayDeliveriesComponent {
  private salesStore = inject(SalesStore);
  private demoMode = inject(DemoModeService);

  readonly basePath = computed(() => (this.demoMode.isDemoMode() ? '/demo' : '/app'));

  readonly todayDeliveries = computed(() => {
    const today = new Date();
    const ty = today.getFullYear();
    const tm = today.getMonth();
    const td = today.getDate();

    return this.salesStore.sales().filter((sale: Sale) => {
      if (!sale.deliveryDate) return false;
      if (sale.status === 'delivered') return false;
      const d = sale.deliveryDate.toDate();
      return d.getFullYear() === ty && d.getMonth() === tm && d.getDate() === td;
    });
  });

  getStatusLabel(status: SaleStatus): string {
    switch (status) {
      case 'draft':
        return SALE_STATUS_DISPLAY.draft;
      case 'pending':
        return SALE_STATUS_DISPLAY.pending;
      case 'production':
        return SALE_STATUS_DISPLAY.production;
      case 'delivered':
        return SALE_STATUS_DISPLAY.delivered;
      case 'cancelled':
        return SALE_STATUS_DISPLAY.cancelled;
      default:
        return status;
    }
  }

  getStatusClass(status: SaleStatus): string {
    switch (status) {
      case 'draft':
        return SALE_STATUS_CLASS.draft;
      case 'delivered':
        return SALE_STATUS_CLASS.delivered;
      case 'pending':
        return SALE_STATUS_CLASS.pending;
      case 'production':
        return SALE_STATUS_CLASS.production;
      case 'cancelled':
        return SALE_STATUS_CLASS.cancelled;
      default:
        return '';
    }
  }
}
