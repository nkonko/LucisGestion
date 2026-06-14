import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CategoryFormComponent } from './category-form.component';

describe('CategoryFormComponent', () => {
  let fixture: ComponentFixture<CategoryFormComponent>;
  let component: CategoryFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryFormComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('category', 'cakes');
    fixture.componentRef.setInput('yieldValue', 2);
    fixture.detectChanges();
  });

  it('emits category changes from the select control', () => {
    const emitSpy = vi.fn();
    component.categoryChange.subscribe(emitSpy);

    const categorySelectElement = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    categorySelectElement.value = 'pies';
    categorySelectElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith('pies');
  });

  it('emits normalized yield values for null and invalid numeric inputs', () => {
    const emitSpy = vi.fn();
    component.yieldValueChange.subscribe(emitSpy);

    component.onYieldValueChange(null);
    component.onYieldValueChange(Number.NaN);
    component.onYieldValueChange(Number.POSITIVE_INFINITY);
    component.onYieldValueChange(-4);
    component.onYieldValueChange(8);

    expect(emitSpy).toHaveBeenCalledTimes(5);
    expect(emitSpy).toHaveBeenNthCalledWith(1, 1);
    expect(emitSpy).toHaveBeenNthCalledWith(2, 1);
    expect(emitSpy).toHaveBeenNthCalledWith(3, 1);
    expect(emitSpy).toHaveBeenNthCalledWith(4, 1);
    expect(emitSpy).toHaveBeenNthCalledWith(5, 8);
  });
});
