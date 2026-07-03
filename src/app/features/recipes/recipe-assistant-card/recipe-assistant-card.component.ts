import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Recipe, RECIPE_CATEGORY_DISPLAY, RECIPE_CATEGORY_ICON } from '../../../core/models/recipe';
import { UNIT_DISPLAY } from '../../../core/models/ingredient/measurement-unit.model';

@Component({
  selector: 'app-recipe-assistant-card',
  imports: [],
  templateUrl: './recipe-assistant-card.component.html',
  styleUrl: './recipe-assistant-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeAssistantCardComponent {
  readonly recipe = input.required<Recipe>();
  readonly viewDetail = output<Recipe>();

  readonly categoryDisplay = RECIPE_CATEGORY_DISPLAY;
  readonly categoryIcon = RECIPE_CATEGORY_ICON;
  readonly unitDisplay = UNIT_DISPLAY;
}
