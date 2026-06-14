import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CostFormComponent } from './cost-form.component';

describe('CostFormComponent', () => {
  let fixture: ComponentFixture<CostFormComponent>;
  let component: CostFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CostFormComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('calculatedCost', 100);
    fixture.componentRef.setInput('suggestedPrice', 160);
    fixture.componentRef.setInput('profitMargin', 60);
    fixture.componentRef.setInput('salePrice', 150);
    fixture.detectChanges();
  });

  it('emits normalized profit margin values', () => {
    const emitSpy = vi.fn();
    component.profitMarginChange.subscribe(emitSpy);

    component.onProfitMarginChange(null);
    component.onProfitMarginChange(120);

    expect(emitSpy).toHaveBeenCalledTimes(2);
    expect(emitSpy).toHaveBeenNthCalledWith(1, 0);
    expect(emitSpy).toHaveBeenNthCalledWith(2, 120);
  });

  it('emits normalized sale price values', () => {
    const emitSpy = vi.fn();
    component.salePriceChange.subscribe(emitSpy);

    component.onSalePriceChange(null);
    component.onSalePriceChange(350);

    expect(emitSpy).toHaveBeenCalledTimes(2);
    expect(emitSpy).toHaveBeenNthCalledWith(1, 0);
    expect(emitSpy).toHaveBeenNthCalledWith(2, 350);
  });
});
