import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { RecipesStore } from '../../core/store/recipes.store';
import { Recipe, RECIPE_CATEGORY_DISPLAY, RECIPE_CATEGORY_ICON } from '../../core/models/recipe';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { RecipeWizardComponent } from './recipe-wizard/recipe-wizard.component';
import { RecipeAssistantCardComponent } from './recipe-assistant-card/recipe-assistant-card.component';
import { AiRecipeGeneratorComponent } from './ai-recipe-generator/ai-recipe-generator.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [
    ArsPipe,
    RecipeWizardComponent,
    RecipeAssistantCardComponent,
    AiRecipeGeneratorComponent,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipesComponent {
  private readonly store = inject(RecipesStore);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  recipes = this.store.recipes;
  filteredRecipes = this.store.filteredRecipes;
  categories = this.store.categories;
  selectedCategory = this.store.selectedCategory;
  searchQuery = this.store.searchQuery;
  isLoading = this.store.isLoading;

  RECIPE_CATEGORY_DISPLAY = RECIPE_CATEGORY_DISPLAY;
  RECIPE_CATEGORY_ICON = RECIPE_CATEGORY_ICON;

  constructor() {}

  createRecipe() {
    const dialogRef = this.dialog.open(RecipeWizardComponent, {
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh',
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'created') {
        this.notify.success('Receta creada');
      }
    });
  }

  edit(recipe: Recipe) {
    const dialogRef = this.dialog.open(RecipeWizardComponent, {
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh',
      data: { recipe }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'updated') {
        this.notify.success('Receta actualizada');
      } else if (result === 'deleted') {
        this.notify.success('Receta eliminada');
      }
    });
  }

  setCategory(category: string | null) {
    this.store.setCategory(category);
  }

  setSearchQuery(query: string) {
    this.store.setSearchQuery(query);
  }

  showAiRecipeGenerator() {
    this.dialog.open(AiRecipeGeneratorComponent, {
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh'
    });
  }
}