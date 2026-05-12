import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ArsPipe } from '../../../../shared/pipes/ars.pipe';
import { Recipe } from '../../../../core/models/recipe';

@Component({
  selector: 'app-sale-product-item',
  imports: [ArsPipe],
  templateUrl: './sale-product-item.component.html',
  styleUrl: './sale-product-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleProductItemComponent {
  readonly recipe = input.required<Recipe>();
  readonly quantity = input(0);

  readonly increment = output<void>();
  readonly decrement = output<void>();

  onIncrement(): void {
    this.increment.emit();
  }

  onDecrement(): void {
    this.decrement.emit();
  }
}
