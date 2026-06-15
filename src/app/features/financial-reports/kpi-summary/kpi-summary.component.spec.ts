import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiSummaryComponent } from './kpi-summary.component';

describe('KpiSummaryComponent', () => {
  let fixture: ComponentFixture<KpiSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KpiSummaryComponent);
    fixture.componentRef.setInput('monthlySales', 100000);
    fixture.componentRef.setInput('periodVariableExpenses', 30000);
    fixture.componentRef.setInput('periodFixedCosts', 20000);
    fixture.componentRef.setInput('netProfit', 50000);
    fixture.componentRef.setInput('hasSalesData', true);
    fixture.componentRef.setInput('variableCostRate', 30);
    fixture.componentRef.setInput('fixedCostRate', 20);
    fixture.componentRef.setInput('isProfitable', true);
    fixture.componentRef.setInput('profitRate', 50);
    fixture.detectChanges();
  });

  it('renders KPI labels', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ingresos totales');
    expect(text).toContain('Costos variables');
    expect(text).toContain('Gastos fijos');
    expect(text).toContain('Beneficio neto');
  });
});
