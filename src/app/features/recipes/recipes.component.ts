import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { RecipesStore } from '../../core/store/recipes.store';
import { Recipe } from '../../core/models/recipe';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { RecipeFormComponent } from './recipe-form.component';
import { CatalogDialogComponent } from './catalog-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { DialogService } from '../../core/services/dialog.service';
import { UiIconComponent } from '../../shared/ui/components';

@Component({
  selector: 'app-recipes',
  imports: [ArsPipe, UiIconComponent],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'openMenuRecipeId.set(null)',
  },
})
export class RecipesComponent {
  readonly store = inject(RecipesStore);
  readonly auth = inject(AuthService);
  private dialog = inject(DialogService);
  private notify = inject(NotificationService);

  readonly openMenuRecipeId = signal<string | null>(null);

  create(): void {
    const dialogRef = this.dialog.open<null, Recipe>(RecipeFormComponent, {
      maxWidth: '560px',
      maxHeight: '90vh',
      panelClass: 'recipe-dialog',
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
      maxWidth: '560px',
      maxHeight: '90vh',
      panelClass: 'recipe-dialog',
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

  async duplicate(recipe: Recipe): Promise<void> {
    await this.store.duplicateRecipe(recipe);
    this.notify.success('Receta duplicada');
  }

  viewCatalog(): void {
    this.dialog.open<null, never>(CatalogDialogComponent, {
      maxWidth: '600px',
      maxHeight: '90vh',
      data: null,
    });
  }

  toggleMenu(recipeId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuRecipeId.update((current) => (current === recipeId ? null : recipeId));
  }

  onMenuClick(event: Event): void {
    event.stopPropagation();
  }
}
