import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinancialReportsComponent } from './financial-reports.component';
import { FinancialInsightsService } from '../../core/services/financial-insights.service';
import { DashboardMetricsService } from '../../core/services/dashboard-metrics.service';
import { DashboardStore } from '../../core/store/dashboard.store';
import { SalesStore } from '../../core/store/sales.store';
import { IngredientsStore } from '../../core/store/ingredients.store';
import type { CustomerImportance, ProductOpportunity, ExpenseAnomaly, PriorityCustomer } from '../../core/models/financial-report';

function mockTimestamp(isoDate?: string) {
  const d = isoDate ? new Date(isoDate) : new Date();
  return {
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => d,
    toMillis: () => d.getTime(),
    isEqual: () => false,
  };
}

describe('FinancialReportsComponent', () => {
  let fixture: ComponentFixture<FinancialReportsComponent>;
  let customerImportanceSignal: ReturnType<typeof signal<CustomerImportance[]>>;
  let productOpportunitiesSignal: ReturnType<typeof signal<ProductOpportunity[]>>;
  let expenseAnomaliesSignal: ReturnType<typeof signal<ExpenseAnomaly[]>>;
  let priorityCustomersSignal: ReturnType<typeof signal<PriorityCustomer[]>>;
  let monthlySalesSignal: ReturnType<typeof signal<number>>;
  let monthlyExpensesSignal: ReturnType<typeof signal<number>>;
  let periodFixedCostsSignal: ReturnType<typeof signal<number>>;
  let periodVariableExpensesSignal: ReturnType<typeof signal<number>>;
  let netProfitSignal: ReturnType<typeof signal<number>>;
  let periodLabelSignal: ReturnType<typeof signal<string>>;
  let isCurrentMonthSignal: ReturnType<typeof signal<boolean>>;
  let salesSignal: ReturnType<typeof signal<object[]>>;
  let lowStockSignal: ReturnType<typeof signal<object[]>>;

  beforeEach(async () => {
    customerImportanceSignal = signal<CustomerImportance[]>([]);
    productOpportunitiesSignal = signal<ProductOpportunity[]>([]);
    expenseAnomaliesSignal = signal<ExpenseAnomaly[]>([]);
    priorityCustomersSignal = signal<PriorityCustomer[]>([]);
    monthlySalesSignal = signal(0);
    monthlyExpensesSignal = signal(0);
    periodFixedCostsSignal = signal(0);
    periodVariableExpensesSignal = signal(0);
    netProfitSignal = signal(0);
    periodLabelSignal = signal('Enero 2026');
    isCurrentMonthSignal = signal(true);
    salesSignal = signal<object[]>([]);
    lowStockSignal = signal<object[]>([]);

    TestBed.configureTestingModule({
      imports: [FinancialReportsComponent],
      providers: [
        {
          provide: FinancialInsightsService,
          useValue: {
            customerImportance: customerImportanceSignal,
            productOpportunities: productOpportunitiesSignal,
            expenseAnomalies: expenseAnomaliesSignal,
            priorityCustomers: priorityCustomersSignal,
            selectedMonthKey: () => '2026-01',
          },
        },
        {
          provide: DashboardMetricsService,
          useValue: {
            monthlySales: monthlySalesSignal,
            monthlyExpenses: monthlyExpensesSignal,
            periodFixedCosts: periodFixedCostsSignal,
            periodVariableExpenses: periodVariableExpensesSignal,
            netProfit: netProfitSignal,
          },
        },
        {
          provide: DashboardStore,
          useValue: {
            periodLabel: periodLabelSignal,
            isCurrentMonth: isCurrentMonthSignal,
            goToPreviousMonth: vi.fn(),
            goToNextMonth: vi.fn(),
            goToCurrentMonth: vi.fn(),
          },
        },
        {
          provide: SalesStore,
          useValue: { sales: salesSignal },
        },
        {
          provide: IngredientsStore,
          useValue: { lowStock: lowStockSignal },
        },
      ],
    });

    fixture = TestBed.createComponent(FinancialReportsComponent);
    fixture.detectChanges();
  });

  describe('empty state', () => {
    it('shows heading', () => {
      expect(fixture.nativeElement.textContent).toContain('Reportes financieros');
    });

    it('hides insight sections when signals are empty', () => {
      expect(fixture.nativeElement.querySelector('[aria-label="Insights automáticos"]')).toBeFalsy();
    });

    it('hides customer section when empty', () => {
      expect(fixture.nativeElement.querySelector('[aria-label="Clientes destacados"]')).toBeFalsy();
    });

    it('hides products section when empty', () => {
      expect(fixture.nativeElement.querySelector('[aria-label="Productos más vendidos"]')).toBeFalsy();
    });

    it('hides low stock section when empty', () => {
      expect(fixture.nativeElement.querySelector('[aria-label="Alertas de stock"]')).toBeFalsy();
    });
  });

  describe('KPI cards', () => {
    it('renders income card', () => {
      monthlySalesSignal.set(150000);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Ingresos totales');
      expect(fixture.nativeElement.textContent).toContain('150.000');
    });

    it('renders net profit with positive color when profitable', () => {
      monthlySalesSignal.set(200000);
      periodVariableExpensesSignal.set(50000);
      periodFixedCostsSignal.set(30000);
      netProfitSignal.set(120000);
      fixture.detectChanges();

      const profitEl = fixture.nativeElement.querySelector('.kpi-card--success');
      expect(profitEl).toBeTruthy();
      expect(profitEl.textContent).toContain('120.000');
    });

    it('renders net profit with negative color when loss', () => {
      monthlySalesSignal.set(50000);
      periodVariableExpensesSignal.set(40000);
      periodFixedCostsSignal.set(30000);
      netProfitSignal.set(-20000);
      fixture.detectChanges();

      const profitEl = fixture.nativeElement.querySelector('.kpi-card--danger');
      expect(profitEl).toBeTruthy();
    });
  });

  describe('product opportunities', () => {
    it('renders opportunity cards', () => {
      productOpportunitiesSignal.set([
        {
          id: 'po-1', type: 'product-opportunity', severity: 'info',
          recipeId: 'rec-1', recipeName: 'Torta', soldUnits: 30, estimatedRevenue: 300000,
          title: 'Alta rotación: Torta', description: '', impact: '', recommendation: 'Evalúa aumentar producción.',
        },
      ]);
      fixture.detectChanges();

      const section = fixture.nativeElement.querySelector('[aria-label="Insights automáticos"]');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('OPORTUNIDAD');
      expect(section.textContent).toContain('Torta');
    });
  });

  describe('expense anomalies', () => {
    it('renders anomaly cards', () => {
      expenseAnomaliesSignal.set([
        {
          id: 'ea-1', type: 'expense-anomaly', severity: 'critical',
          category: 'utilities', currentAmount: 1200, baselineAmount: 800, increaseRatio: 0.5,
          title: 'Aumento en utilities', description: '', impact: '', recommendation: '',
        },
      ]);
      fixture.detectChanges();

      const section = fixture.nativeElement.querySelector('[aria-label="Insights automáticos"]');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('CRÍTICO');
      expect(section.textContent).toContain('Aumento en utilities');
    });
  });

  describe('priority customers', () => {
    it('renders priority customer cards', () => {
      priorityCustomersSignal.set([
        {
          id: 'pc-1', type: 'priority-customer', severity: 'info',
          customerId: 'cust-1', customerName: 'VIP Cliente', billedAmount: 150000, purchasesCount: 5,
          title: '', description: '', impact: '', recommendation: 'Diseña una acción de fidelización.',
        },
      ]);
      fixture.detectChanges();

      const section = fixture.nativeElement.querySelector('[aria-label="Insights automáticos"]');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('ALTO IMPACTO');
      expect(section.textContent).toContain('VIP Cliente');
    });
  });

  describe('top customers', () => {
    it('renders customer share bars', () => {
      customerImportanceSignal.set([
        { customerId: 'c1', customerName: 'Cliente A', revenue: 100000, ordersCount: 5, lastPurchaseAt: new Date(), importanceTier: 'alto', retentionHint: '' },
        { customerId: 'c2', customerName: 'Cliente B', revenue: 50000, ordersCount: 3, lastPurchaseAt: new Date(), importanceTier: 'medio', retentionHint: '' },
      ]);
      fixture.detectChanges();

      const section = fixture.nativeElement.querySelector('[aria-label="Clientes destacados"]');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('Cliente A');
      expect(section.textContent).toContain('Cliente B');
    });
  });

  describe('top products', () => {
    it('renders product table from sales data', () => {
      salesSignal.set([
        {
          id: 's1',
          date: mockTimestamp(),
          deliveryDate: null,
          customerId: null,
          customerName: '',
          items: [{ recipeId: 'r1', name: 'Torta', quantity: 5, unitPrice: 10000, unitCost: 4000 }],
          total: 50000,
          totalCost: 20000,
          profit: 30000,
          isPaid: true,
          paymentMethod: 'cash',
          status: 'delivered',
          notes: '',
        },
      ]);
      fixture.detectChanges();

      const section = fixture.nativeElement.querySelector('[aria-label="Productos más vendidos"]');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('Torta');
      expect(section.textContent).toContain('5');
    });
  });

  describe('low stock', () => {
    it('renders low stock alerts', () => {
      lowStockSignal.set([
        {
          id: 'i1', name: 'Harina', unit: 'kg', unitPrice: 100,
          currentStock: 2, minimumStock: 10, category: 'dry',
          lastPurchase: mockTimestamp(), active: true,
        },
      ]);
      fixture.detectChanges();

      const section = fixture.nativeElement.querySelector('[aria-label="Alertas de stock"]');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('Harina');
    });
  });

  describe('navigation', () => {
    let store: { goToPreviousMonth: ReturnType<typeof vi.fn>; goToNextMonth: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      store = TestBed.inject(DashboardStore) as unknown as { goToPreviousMonth: ReturnType<typeof vi.fn>; goToNextMonth: ReturnType<typeof vi.fn> };
    });

    it('calls goToPreviousMonth', () => {
      const btn = fixture.nativeElement.querySelector('[aria-label="Mes anterior"]');
      btn.click();
      expect(store.goToPreviousMonth).toHaveBeenCalled();
    });

    it('calls goToNextMonth', () => {
      isCurrentMonthSignal.set(false);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('[aria-label="Mes siguiente"]');
      btn.click();
      expect(store.goToNextMonth).toHaveBeenCalled();
    });
  });

  describe('quick actions', () => {
    it('renders all action buttons', () => {
      const section = fixture.nativeElement.querySelector('[aria-label="Acciones rápidas"]');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('Exportar PDF');
      expect(section.textContent).toContain('Exportar Excel');
      expect(section.textContent).toContain('Compartir reporte');
      expect(section.textContent).toContain('Recomendaciones IA');
    });
  });

  describe('period selector', () => {
    it('renders period options', () => {
      expect(fixture.nativeElement.textContent).toContain('Hoy');
      expect(fixture.nativeElement.textContent).toContain('Semana');
      expect(fixture.nativeElement.textContent).toContain('Mes');
      expect(fixture.nativeElement.textContent).toContain('Año');
    });
  });

  describe('all sections visible with data', () => {
    it('shows all sections simultaneously', () => {
      monthlySalesSignal.set(100000);
      productOpportunitiesSignal.set([
        { id: 'po-1', type: 'product-opportunity', severity: 'info', recipeId: 'r1', recipeName: 'Pan', soldUnits: 25, estimatedRevenue: 5000, title: '', description: '', impact: '', recommendation: '' },
      ]);
      expenseAnomaliesSignal.set([
        { id: 'ea-1', type: 'expense-anomaly', severity: 'warning', category: 'rent', currentAmount: 2000, baselineAmount: 1500, increaseRatio: 0.33, title: 'Aumento', description: '', impact: '', recommendation: '' },
      ]);
      priorityCustomersSignal.set([
        { id: 'pc-1', type: 'priority-customer', severity: 'info', customerId: 'c1', customerName: 'VIP', billedAmount: 60000, purchasesCount: 3, title: '', description: '', impact: '', recommendation: '' },
      ]);
      customerImportanceSignal.set([
        { customerId: 'c1', customerName: 'Cliente A', revenue: 100000, ordersCount: 5, lastPurchaseAt: new Date(), importanceTier: 'alto', retentionHint: '' },
      ]);
      salesSignal.set([
        {
          id: 's1', date: mockTimestamp(), deliveryDate: null,
          customerId: null, customerName: '',
          items: [{ recipeId: 'r1', name: 'Pan', quantity: 10, unitPrice: 500, unitCost: 200 }],
          total: 5000, totalCost: 2000, profit: 3000,
          isPaid: true, paymentMethod: 'cash', status: 'delivered', notes: '',
        },
      ]);
      lowStockSignal.set([
        {
          id: 'i1', name: 'Harina', unit: 'kg', unitPrice: 100,
          currentStock: 2, minimumStock: 10, category: 'dry',
          lastPurchase: mockTimestamp(), active: true,
        },
      ]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[aria-label="Insights automáticos"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[aria-label="Clientes destacados"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[aria-label="Productos más vendidos"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[aria-label="Alertas de stock"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[aria-label="Acciones rápidas"]')).toBeTruthy();
    });
  });
});
