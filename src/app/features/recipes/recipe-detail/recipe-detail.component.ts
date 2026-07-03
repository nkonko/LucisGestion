import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Recipe } from '../../../core/models/recipe';
import { UNIT_DISPLAY } from '../../../core/models/ingredient/measurement-unit.model';
import { DIALOG_DATA, DIALOG_REF } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';

@Component({
  selector: 'app-recipe-detail',
  imports: [],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetailComponent {
  readonly recipe = inject<Recipe>(DIALOG_DATA);
  readonly dialogRef = inject<DialogRef<void>>(DIALOG_REF);
  readonly unitDisplay = UNIT_DISPLAY;

  close(): void {
    this.dialogRef.close();
  }
}
