import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { RecipesStore } from '../../core/store/recipes.store';
import { Recipe } from '../../core/models/recipe';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { RecipeFormComponent } from './recipe-form.component';
import { CatalogDialogComponent } from './catalog-dialog.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recipes',
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    ArsPipe,
  ],
  templateUrl: './recipes.component.html',
})
export class RecipesComponent {
  readonly store = inject(RecipesStore);
  readonly auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  create() {
    const dialogRef = this.dialog.open(RecipeFormComponent, {
      width: '100%',
      maxWidth: '560px',
      maxHeight: '90vh',
      panelClass: 'recipe-dialog',
      data: null,
    });

    dialogRef.afterClosed().subscribe(async (result: Recipe | undefined) => {
      if (result) {
        await this.store.createRecipe(result);
        this.notify.success('Receta creada');
      }
    });
  }

  edit(recipe: Recipe) {
    const dialogRef = this.dialog.open(RecipeFormComponent, {
      width: '100%',
      maxWidth: '560px',
      maxHeight: '90vh',
      data: recipe,
    });

    dialogRef.afterClosed().subscribe(async (result: Recipe | 'delete' | undefined) => {
      if (result === 'delete') {
        await this.store.deleteRecipe(recipe.id!);
        this.notify.success('Receta eliminada');
      } else if (result) {
        await this.store.updateRecipe(recipe.id!, result);
        this.notify.success('Receta actualizada');
      }
    });
  }

  async duplicate(recipe: Recipe) {
    await this.store.duplicateRecipe(recipe);
    this.notify.success('Receta duplicada');
  }

  viewCatalog() {
    this.dialog.open(CatalogDialogComponent, {
      width: '100%',
      maxWidth: '600px',
      maxHeight: '90vh',
    });
  }
}
