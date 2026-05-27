import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinancialReportsComponent } from './financial-reports.component';
import { FinancialInsightsService } from '../../core/services/financial-insights.service';
import type { CustomerImportance, ProductOpportunity, ExpenseAnomaly, PriorityCustomer } from '../../core/models/financial-report';

describe('FinancialReportsComponent', () => {
  let fixture: ComponentFixture<FinancialReportsComponent>;
  let customerImportanceSignal: ReturnType<typeof signal<CustomerImportance[]>>;
  let productOpportunitiesSignal: ReturnType<typeof signal<ProductOpportunity[]>>;
  let expenseAnomaliesSignal: ReturnType<typeof signal<ExpenseAnomaly[]>>;
  let priorityCustomersSignal: ReturnType<typeof signal<PriorityCustomer[]>>;

  beforeEach(async () => {
    customerImportanceSignal = signal<CustomerImportance[]>([]);
    productOpportunitiesSignal = signal<ProductOpportunity[]>([]);
    expenseAnomaliesSignal = signal<ExpenseAnomaly[]>([]);
    priorityCustomersSignal = signal<PriorityCustomer[]>([]);

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
      ],
    });

    fixture = TestBed.createComponent(FinancialReportsComponent);
    fixture.detectChanges();
  });

  describe('empty state', () => {
    it('shows empty message when there are no insights', () => {
      expect(fixture.nativeElement.textContent).toContain('No se detectaron insights');
    });

    it('hides all insight sections when signals are empty', () => {
      expect(fixture.nativeElement.querySelector('[aria-labelledby="clientes-a-cuidar-title"]')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('[aria-label="Oportunidades de producto"]')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('[aria-label="Alertas de gastos fijos"]')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('[aria-label="Clientes prioritarios"]')).toBeFalsy();
    });
  });

  describe('period label', () => {
    it('shows the selected month key', () => {
      const periodText: HTMLElement = fixture.nativeElement.querySelector('.text-gray-600');
      expect(periodText.textContent).toContain('2026-01');
    });
  });

  describe('customer importance section', () => {
    it('renders customer cards', () => {
      customerImportanceSignal.set([
        {
          customerId: 'cust-1',
          customerName: 'Cliente Premium',
          revenue: 150000,
          ordersCount: 6,
          lastPurchaseAt: new Date(2026, 0, 20),
          importanceTier: 'alto',
          retentionHint: 'Seguimiento personalizado y contacto preventivo.',
        },
      ]);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('li');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('Cliente Premium');
      expect(items[0].textContent).toContain('$150.000');
      expect(items[0].textContent).toContain('6 compras');
      expect(items[0].textContent).toContain('20/01/2026');
      expect(items[0].textContent).toContain('alto');
      expect(items[0].textContent).toContain('Seguimiento personalizado y contacto preventivo.');
    });

    it('hides section when there are no customers to care for', () => {
      expect(fixture.nativeElement.querySelector('[aria-labelledby="clientes-a-cuidar-title"]')).toBeFalsy();
    });
  });

  describe('product opportunities section', () => {
    it('renders product opportunity cards', () => {
      productOpportunitiesSignal.set([
        {
          id: 'po-1',
          type: 'product-opportunity',
          severity: 'info',
          recipeId: 'rec-1',
          recipeName: 'Torta',
          soldUnits: 30,
          estimatedRevenue: 300000,
          title: 'Alta rotación: Torta',
          description: 'Se vendieron 30 unidades.',
          impact: 'Ingresos estimados: $300.000.',
          recommendation: 'Evalúa aumentar producción.',
        },
      ]);
      fixture.detectChanges();

      const section = fixture.nativeElement.querySelector('[aria-label="Oportunidades de producto"]');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('Alta rotación: Torta');
      expect(section.textContent).toContain('Se vendieron 30 unidades.');
    });

    it('hides section when there are no opportunities', () => {
      expect(fixture.nativeElement.querySelector('[aria-label="Oportunidades de producto"]')).toBeFalsy();
    });
  });

  describe('expense anomalies section', () => {
    it('renders expense anomaly cards', () => {
      expenseAnomaliesSignal.set([
        {
          id: 'ea-1',
          type: 'expense-anomaly',
          severity: 'critical',
          category: 'utilities',
          currentAmount: 1200,
          baselineAmount: 800,
          increaseRatio: 0.5,
          title: 'Aumento de costos en utilities',
          description: 'El costo subió 50%.',
          impact: 'Mes actual: $1.200 vs promedio: $800.',
          recommendation: 'Revisa contratos.',
        },
      ]);
      fixture.detectChanges();

      const section = fixture.nativeElement.querySelector('[aria-label="Alertas de gastos fijos"]');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('Aumento de costos en utilities');
    });

    it('hides section when there are no anomalies', () => {
      expect(fixture.nativeElement.querySelector('[aria-label="Alertas de gastos fijos"]')).toBeFalsy();
    });
  });

  describe('priority customers section', () => {
    it('renders priority customer cards', () => {
      priorityCustomersSignal.set([
        {
          id: 'pc-1',
          type: 'priority-customer',
          severity: 'info',
          customerId: 'cust-1',
          customerName: 'VIP Cliente',
          billedAmount: 150000,
          purchasesCount: 5,
          title: 'Cliente prioritario: VIP Cliente',
          description: 'Realizó 5 compras.',
          impact: 'Facturación acumulada: $150.000.',
          recommendation: 'Diseña una acción de fidelización.',
        },
      ]);
      fixture.detectChanges();

      const section = fixture.nativeElement.querySelector('[aria-label="Clientes prioritarios"]');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('VIP Cliente');
      expect(section.textContent).toContain('Compras: 5');
      expect(section.textContent).toContain('$150.000');
    });

    it('hides section when there are no priority customers', () => {
      expect(fixture.nativeElement.querySelector('[aria-label="Clientes prioritarios"]')).toBeFalsy();
    });
  });

  describe('section visibility', () => {
    it('shows multiple sections simultaneously when data is present', () => {
      customerImportanceSignal.set([
        {
          customerId: 'c1', customerName: 'A', revenue: 1000, ordersCount: 1,
          lastPurchaseAt: new Date(), importanceTier: 'bajo', retentionHint: '',
        },
      ]);
      productOpportunitiesSignal.set([
        {
          id: 'po-1', type: 'product-opportunity', severity: 'info',
          recipeId: 'r1', recipeName: 'Pan', soldUnits: 25, estimatedRevenue: 5000,
          title: 'Alta rotación', description: '', impact: '', recommendation: '',
        },
      ]);
      expenseAnomaliesSignal.set([
        {
          id: 'ea-1', type: 'expense-anomaly', severity: 'warning',
          category: 'rent', currentAmount: 2000, baselineAmount: 1500, increaseRatio: 0.33,
          title: 'Aumento', description: '', impact: '', recommendation: '',
        },
      ]);
      priorityCustomersSignal.set([
        {
          id: 'pc-1', type: 'priority-customer', severity: 'info',
          customerId: 'c1', customerName: 'VIP', billedAmount: 60000, purchasesCount: 3,
          title: 'Cliente prioritario', description: '', impact: '', recommendation: '',
        },
      ]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[aria-labelledby="clientes-a-cuidar-title"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[aria-label="Oportunidades de producto"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[aria-label="Alertas de gastos fijos"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[aria-label="Clientes prioritarios"]')).toBeTruthy();
      expect(fixture.nativeElement.textContent).not.toContain('No se detectaron insights');
    });
  });
});
