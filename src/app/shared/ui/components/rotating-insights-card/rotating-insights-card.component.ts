import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { ArsPipe } from '../../../pipes/ars.pipe';
import { UiIconComponent } from '../ui-icon/ui-icon.component';
import type { Sale } from '../../../../core/models/sale';

export interface RotatingInsightProduct {
  id: string;
  name: string;
  quantity: number;
}

export interface RotatingInsightCustomer {
  id: string;
  name: string;
  total: number;
}

type InsightTab = 'products' | 'customers' | 'sales';

@Component({
  selector: 'app-rotating-insights-card',
  imports: [UiIconComponent, ArsPipe],
  templateUrl: './rotating-insights-card.component.html',
  styleUrl: './rotating-insights-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RotatingInsightsCardComponent {
  private destroyRef = inject(DestroyRef);

  readonly topProducts = input<RotatingInsightProduct[]>([]);
  readonly bestCustomers = input<RotatingInsightCustomer[]>([]);
  readonly latestSales = input<Sale[]>([]);

  readonly tabs: InsightTab[] = ['products', 'customers', 'sales'];
  readonly activeTab = signal<InsightTab>('products');
  readonly isFading = signal(false);

  readonly visibleProducts = computed(() => this.topProducts().slice(0, 3));
  readonly visibleCustomers = computed(() => this.bestCustomers().slice(0, 3));
  readonly visibleSales = computed(() => this.latestSales().slice(0, 3));

  readonly subtitle = computed(() => {
    const active = this.activeTab();
    if (active === 'products') {
      return 'Productos más vendidos';
    }
    if (active === 'customers') {
      return 'Clientes con más pedidos';
    }
    return 'Últimos pedidos';
  });

  private rotationIntervalId: ReturnType<typeof setInterval> | null = null;
  private swapTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.rotationIntervalId = setInterval(() => { this.goToNextTab(); }, 10_000);
    this.destroyRef.onDestroy(() => {
      if (this.rotationIntervalId) {
        clearInterval(this.rotationIntervalId);
      }
      if (this.swapTimeoutId) {
        clearTimeout(this.swapTimeoutId);
      }
    });
  }

  setActiveTab(tab: InsightTab): void {
    if (tab === this.activeTab()) {
      return;
    }
    this.transitionTo(tab);
    this.restartRotation();
  }

  getTabLabel(tab: InsightTab): string {
    if (tab === 'products') {
      return 'Más vendidos';
    }
    if (tab === 'customers') {
      return 'Mejores clientes';
    }
    return 'Últimos pedidos';
  }

  getTabIcon(tab: InsightTab): string {
    if (tab === 'products') {
      return 'emoji_events';
    }
    if (tab === 'customers') {
      return 'groups';
    }
    return 'receipt';
  }

  trackById(_: number, item: RotatingInsightProduct | RotatingInsightCustomer | Sale): string {
    return item.id ?? '';
  }

  private goToNextTab(): void {
    const current = this.activeTab();
    const nextTab = current === 'products' ? 'customers' : current === 'customers' ? 'sales' : 'products';
    this.transitionTo(nextTab);
  }

  private transitionTo(tab: InsightTab): void {
    if (this.swapTimeoutId) {
      clearTimeout(this.swapTimeoutId);
    }

    this.isFading.set(true);
    this.swapTimeoutId = setTimeout(() => {
      this.activeTab.set(tab);
      this.isFading.set(false);
      this.swapTimeoutId = null;
    }, 220);
  }

  private restartRotation(): void {
    if (this.rotationIntervalId) {
      clearInterval(this.rotationIntervalId);
    }
    this.rotationIntervalId = setInterval(() => { this.goToNextTab(); }, 10_000);
  }
}
