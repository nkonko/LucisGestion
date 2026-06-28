import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiIconComponent } from '../components';

@Component({
  selector: 'app-stepper',
  imports: [UiIconComponent],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent {
  readonly steps = input.required<string[]>();
  readonly activeStep = input.required<number>();
  readonly stepChange = output<number>();

  isCompleted(index: number): boolean {
    return index < this.activeStep();
  }

  isActive(index: number): boolean {
    return index === this.activeStep();
  }

  isInactive(index: number): boolean {
    return index > this.activeStep();
  }

  onStepClick(index: number): void {
    this.stepChange.emit(index);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.stepChange.emit(index);
    }
  }
}
