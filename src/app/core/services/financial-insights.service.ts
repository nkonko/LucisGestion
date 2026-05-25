import { Injectable, computed, inject } from '@angular/core';
import { SalesStore } from '../store/sales.store';
import { CustomersStore } from '../store/customers.store';
import { DashboardStore } from '../store/dashboard.store';
import { getPeriodEnd, getPeriodStart } from '../utils/dashboard.utils';
import { CustomerImportance, ImportanceTier } from '../models/financial-report/customer-importance.model';

@Injectable({ providedIn: 'root' })
export class FinancialInsightsService {
  private salesStore = inject(SalesStore);
  private customersStore = inject(CustomersStore);
  private dashboardStore = inject(DashboardStore);

  private customersById = computed(
    () => new Map(this.customersStore.customers().map((customer) => [customer.id, customer.name] as const)),
  );

  private periodSales = computed(() => {
    const period = this.dashboardStore.selectedPeriod();
    const selectedDate = this.dashboardStore.selectedDate();
    const start = getPeriodStart(period, selectedDate);
    const end = getPeriodEnd(period, selectedDate);

    return this.salesStore.sales().filter((sale) => {
      const saleDate = sale.date.toDate();
      return saleDate >= start && saleDate < end;
    });
  });

  readonly customerImportance = computed<CustomerImportance[]>(() => {
    const grouped = new Map<string, CustomerImportance>();

    for (const sale of this.periodSales()) {
      const key = this.normalizeCustomerId(sale.customerId);
      const current = grouped.get(key);
      const saleDate = sale.date.toDate();

      if (current) {
        current.revenue += sale.total;
        current.ordersCount += 1;
        current.lastPurchaseAt = !current.lastPurchaseAt || saleDate > current.lastPurchaseAt ? saleDate : current.lastPurchaseAt;
        continue;
      }

      grouped.set(key, {
        customerId: sale.customerId,
        customerName: this.getCustomerName(sale.customerId),
        revenue: sale.total,
        ordersCount: 1,
        lastPurchaseAt: saleDate,
        importanceTier: 'bajo',
        retentionHint: '',
      });
    }

    return [...grouped.values()]
      .map((customer) => {
        const importanceTier = this.resolveTier(customer.revenue, customer.ordersCount);
        return {
          ...customer,
          importanceTier,
          retentionHint: this.resolveRetentionHint(importanceTier),
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.ordersCount - a.ordersCount);
  });

  private getCustomerName(customerId: string | null): string {
    if (typeof customerId !== 'string' || !customerId.trim() || !this.customersById().has(customerId)) {
      return 'Cliente eliminado';
    }
    return this.customersById().get(customerId) ?? 'Cliente eliminado';
  }

  private normalizeCustomerId(customerId: string | null): string {
    if (typeof customerId !== 'string' || !customerId.trim()) {
      return '__deleted_or_anonymous__';
    }
    return customerId;
  }

  private resolveTier(revenue: number, ordersCount: number): ImportanceTier {
    if (revenue >= 150000 || ordersCount >= 6) {
      return 'alto';
    }

    if (revenue >= 60000 || ordersCount >= 3) {
      return 'medio';
    }

    return 'bajo';
  }

  private resolveRetentionHint(tier: ImportanceTier): string {
    switch (tier) {
      case 'alto':
        return 'Seguimiento personalizado y contacto preventivo.';
      case 'medio':
        return 'Promociones segmentadas para subir frecuencia.';
      default:
        return 'Contacto de reactivación con oferta puntual.';
    }
  }
}
