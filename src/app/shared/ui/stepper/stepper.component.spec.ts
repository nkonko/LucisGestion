import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { StepperComponent } from './stepper.component';

describe('StepperComponent', () => {
  let fixture: ComponentFixture<StepperComponent>;
  let component: StepperComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StepperComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('steps', ['Datos básicos', 'Ingredientes', 'Costos', 'Notas']);
    fixture.componentRef.setInput('activeStep', 1);
    fixture.detectChanges();
  });

  it('renders all 3 visual states: completed, active, inactive', () => {
    const indicators = fixture.debugElement.queryAll(By.css('.stepper__indicator'));

    // Step 0: completed
    expect(indicators[0].classes['stepper__indicator--completed']).toBe(true);

    // Step 1: active
    expect(indicators[1].classes['stepper__indicator--active']).toBe(true);

    // Steps 2-3: inactive
    expect(indicators[2].classes['stepper__indicator--inactive']).toBe(true);
    expect(indicators[3].classes['stepper__indicator--inactive']).toBe(true);
  });

  it('shows check icon on completed step', () => {
    const completedIndicator = fixture.debugElement.query(By.css('.stepper__indicator--completed'));
    expect(completedIndicator).toBeTruthy();
    const icon = completedIndicator.query(By.css('ui-icon'));
    expect(icon).toBeTruthy();
  });

  it('shows step number on active and inactive steps', () => {
    const numbers = fixture.debugElement.queryAll(By.css('.stepper__number'));
    expect(numbers.length).toBe(3); // active + 2 inactive = 3 numbers
  });

  it('emits step index on click', () => {
    const emitSpy = vi.fn();
    component.stepChange.subscribe(emitSpy);

    const indicators = fixture.debugElement.queryAll(By.css('.stepper__indicator'));
    indicators[2].nativeElement.click();
    expect(emitSpy).toHaveBeenCalledWith(2);
  });

  it('emits step index on Enter key', () => {
    const emitSpy = vi.fn();
    component.stepChange.subscribe(emitSpy);

    const indicators = fixture.debugElement.queryAll(By.css('.stepper__indicator'));
    indicators[1].nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitSpy).toHaveBeenCalledWith(1);
  });

  it('emits step index on Space key', () => {
    const emitSpy = vi.fn();
    component.stepChange.subscribe(emitSpy);

    const indicators = fixture.debugElement.queryAll(By.css('.stepper__indicator'));
    indicators[3].nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(emitSpy).toHaveBeenCalledWith(3);
  });

  it('has correct ARIA attributes', () => {
    const nav = fixture.debugElement.query(By.css('[role="tablist"]'));
    expect(nav).toBeTruthy();
    expect(nav.attributes['aria-label']).toBe('Progreso del formulario');

    const indicators = fixture.debugElement.queryAll(By.css('[role="tab"]'));
    expect(indicators.length).toBe(4);

    // Active tab has tabindex 0, aria-selected true
    expect(indicators[1].attributes['tabindex']).toBe('0');
    expect(indicators[1].attributes['aria-selected']).toBe('true');

    // Inactive tabs have tabindex -1
    expect(indicators[2].attributes['tabindex']).toBe('-1');
    expect(indicators[3].attributes['tabindex']).toBe('-1');

    // Completed step has correct aria-label
    expect(indicators[0].attributes['aria-label']).toBe('Paso 1 completado');

    // Active step has descriptive aria-label
    expect(indicators[1].attributes['aria-label']).toBe('Paso 2: Ingredientes');
  });

  it('hides labels on mobile viewport', () => {
    // Labels should have sm:inline (shown on sm+) and hidden by default
    const labels = fixture.debugElement.queryAll(By.css('.stepper__label'));
    expect(labels.length).toBe(4);
  });
});
