import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IngredientsStore } from '../../../core/store/ingredients.store';
import { SalesStore } from '../../../core/store/sales.store';
import { DemoModeService } from '../../../core/services/demo-mode.service';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';
import { UiIconComponent } from '../../../shared/ui/components';
import { SALE_STATUS_CLASS, SALE_STATUS_DISPLAY, type Sale, type SaleStatus } from '../../../core/models/sale';

@Component({
  selector: 'app-dashboard-alerts-card',
  imports: [RouterLink, ArsPipe, UiIconComponent],
  templateUrl: './dashboard-alerts-card.component.html',
  styleUrl: './dashboard-alerts-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardAlertsCardComponent {
  private salesStore = inject(SalesStore);
  private ingredientsStore = inject(IngredientsStore);
  private demoMode = inject(DemoModeService);

  readonly basePath = computed(() => (this.demoMode.isDemoMode() ? '/demo' : '/app'));
  readonly lowStock = this.ingredientsStore.lowStock;

  readonly todayDeliveries = computed(() => {
    const today = new Date();
    const ty = today.getFullYear();
    const tm = today.getMonth();
    const td = today.getDate();

    return this.salesStore.sales().filter((sale: Sale) => {
      if (!sale.deliveryDate) return false;
      if (sale.status === 'delivered') return false;
      const date = sale.deliveryDate.toDate();
      return date.getFullYear() === ty && date.getMonth() === tm && date.getDate() === td;
    });
  });

  readonly subtitle = computed(() => {
    const deliveriesCount = this.todayDeliveries().length;
    if (deliveriesCount > 0) {
      return deliveriesCount === 1 ? 'Tenes 1 entrega pendiente para hoy.' : `Tenes ${deliveriesCount} entregas pendientes para hoy.`;
    }

    const lowStockCount = this.lowStock().length;
    if (lowStockCount > 0) {
      return lowStockCount === 1 ? 'No hay entregas hoy y 1 ingrediente con stock bajo.' : `No hay entregas hoy y ${lowStockCount} ingredientes con stock bajo.`;
    }

    return 'No hay entregas ni alertas de stock para hoy.';
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
