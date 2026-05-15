import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-cost-form',
  imports: [FormsModule, ArsPipe],
  templateUrl: './cost-form.component.html',
  styleUrl: './cost-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostFormComponent {
  calculatedCost = input.required<number>();
  suggestedPrice = input.required<number>();
  profitMargin = input.required<number>();
  salePrice = input.required<number>();

  profitMarginChange = output<number>();
  salePriceChange = output<number>();

  onProfitMarginChange(value: number | null): void {
    const nextValue = Number(value ?? 0);
    const normalized = Number.isFinite(nextValue) ? nextValue : 0;
    this.profitMarginChange.emit(normalized);
  }

  onSalePriceChange(value: number | null): void {
    const nextValue = Number(value ?? 0);
    const normalized = Number.isFinite(nextValue) ? nextValue : 0;
    this.salePriceChange.emit(normalized);
  }
}
