import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InsightsComponent } from './insights.component';

describe('InsightsComponent', () => {
  let fixture: ComponentFixture<InsightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InsightsComponent);
    fixture.componentRef.setInput('productOpportunities', [
      {
        id: 'po-1',
        type: 'product-opportunity',
        severity: 'info',
        recipeId: 'r1',
        recipeName: 'Tarta',
        soldUnits: 20,
        estimatedRevenue: 150000,
        title: '',
        description: '',
        impact: '',
        recommendation: 'Subir producción',
      },
    ]);
    fixture.componentRef.setInput('expenseAnomalies', []);
    fixture.componentRef.setInput('priorityCustomers', []);
    fixture.detectChanges();
  });

  it('renders product opportunity data', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('OPORTUNIDAD');
    expect(text).toContain('Tarta');
  });
});
