import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { RecipesStore } from '../../core/store/recipes.store';
import { Recipe, RECIPE_CATEGORY_DISPLAY, RECIPE_CATEGORY_ICON } from '../../core/models/recipe';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { RecipeFormComponent } from './recipe-form/recipe-form.component';
import { CatalogDialogComponent } from './catalog-dialog.component';
import { BottomSheetService } from '../../core/services/bottom-sheet.service';
import { UiIconComponent } from '../../shared/ui/components';
import { AuthStore } from '../../core/store/auth.store';

@Component({
  selector: 'app-recipes',
  imports: [ArsPipe, UiIconComponent],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipesComponent {
  readonly store = inject(RecipesStore);
  readonly auth = inject(AuthStore);
  readonly categoryDisplay = RECIPE_CATEGORY_DISPLAY;
  readonly categoryIcon = RECIPE_CATEGORY_ICON;
  private dialog = inject(BottomSheetService);
  private notify = inject(NotificationService);

  create(): void {
    const dialogRef = this.dialog.open<null, Recipe>(RecipeFormComponent, {
      title: 'Nueva receta',
      section: 'Receta',
      maxWidth: '500px',
      data: null,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result) {
        await this.store.createRecipe(result);
        this.notify.success('Receta creada');
      }
    });
  }

  edit(recipe: Recipe): void {
    const dialogRef = this.dialog.open<Recipe, Recipe | 'delete'>(RecipeFormComponent, {
      title: 'Editar receta',
      section: 'Receta',
      maxWidth: '500px',
      data: recipe,
    });

    dialogRef.afterClosed.subscribe(async (result) => {
      if (result === 'delete') {
        await this.store.deleteRecipe(recipe.id!);
        this.notify.success('Receta eliminada');
      } else if (result) {
        await this.store.updateRecipe(recipe.id!, result);
        this.notify.success('Receta actualizada');
      }
    });
  }

  viewCatalog(): void {
    this.dialog.open<null, never>(CatalogDialogComponent, {
      title: 'Catálogo de Precios',
      section: 'Receta',
      maxWidth: '600px',
      maxHeight: '90vh',
      data: null,
    });
  }
}
