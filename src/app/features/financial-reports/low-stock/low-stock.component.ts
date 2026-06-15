import { Component, input } from '@angular/core';
import { UiIconComponent } from '../../../shared/ui/components';
import type { Ingredient } from '../../../core/models/ingredient/ingredient.model';

@Component({
  selector: 'app-low-stock',
  imports: [UiIconComponent],
  templateUrl: './low-stock.component.html',
  styleUrl: './low-stock.component.scss',
})
export class LowStockComponent {
  readonly items = input.required<Ingredient[]>();
}
