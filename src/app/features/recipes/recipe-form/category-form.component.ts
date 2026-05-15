import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RECIPE_CATEGORY_DISPLAY, RecipeCategory } from '../../../core/models/recipe';

@Component({
  selector: 'app-category-form',
  imports: [FormsModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriaFormComponent {
  category = input.required<RecipeCategory>();
  yieldValue = input.required<number>();

  categoryChange = output<RecipeCategory>();
  yieldValueChange = output<number>();

  categories = Object.entries(RECIPE_CATEGORY_DISPLAY).map(([key, label]) => ({
    key: key as RecipeCategory,
    label,
  }));
}
