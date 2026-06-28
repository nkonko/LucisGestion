import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { RecipesStore } from '../../core/store/recipes.store';
import { Recipe, RECIPE_CATEGORY_DISPLAY, RECIPE_CATEGORY_ICON } from '../../core/models/recipe';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { RecipeWizardComponent } from './recipe-wizard/recipe-wizard.component';
import { CatalogDialogComponent } from './catalog-dialog.component';
import { BottomSheetService } from '../../core/services/bottom-sheet.service';
import { ImagePreviewComponent, UiIconComponent } from '../../shared/ui/components';
import { AuthStore } from '../../core/store/auth.store';

@Component({
  selector: 'app-recipes',
  imports: [ArsPipe, ImagePreviewComponent, UiIconComponent],
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

  readonly previewImageUrl = signal<string | null>(null);
  readonly brokenImageKeys = signal<Map<string, true>>(new Map());

  isThumbnailVisible(recipe: Recipe): boolean {
    if (!recipe.imageUrl) return false;
    return !this.brokenImageKeys().has(this.getImageKey(recipe));
  }

  onThumbnailError(recipe: Recipe): void {
    const imageKey = this.getImageKey(recipe);
    this.brokenImageKeys.update((current) => {
      if (current.has(imageKey)) return current;
      const next = new Map(current);
      next.set(imageKey, true);
      return next;
    });
  }

  private getImageKey(recipe: Recipe): string {
    return `${recipe.id ?? recipe.name}:${recipe.imageUrl}`;
  }

  openPreview(url: string): void {
    this.previewImageUrl.set(url);
  }

  closePreview(): void {
    this.previewImageUrl.set(null);
  }

  create(): void {
    const dialogRef = this.dialog.open<null, Recipe>(RecipeWizardComponent, {
      title: 'Nueva receta',
      section: 'Receta',
      maxWidth: '760px',
      panelClass: 'recipe-wizard--mobile',
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
    const dialogRef = this.dialog.open<Recipe, Recipe | 'delete'>(RecipeWizardComponent, {
      title: 'Editar receta',
      section: 'Receta',
      maxWidth: '760px',
      panelClass: 'recipe-wizard--mobile',
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
