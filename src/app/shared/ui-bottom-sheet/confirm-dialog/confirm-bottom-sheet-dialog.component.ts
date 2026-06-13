import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DIALOG_REF } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';
import { ConfirmDialogData } from './confirm-dialog-data.model';

@Component({
  selector: 'app-confirm-bottom-sheet-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './confirm-bottom-sheet-dialog.component.html',
  styleUrl: './confirm-bottom-sheet-dialog.component.scss',
})
export class ConfirmBottomSheetDialogComponent {
  private readonly dialogRef = inject(DIALOG_REF) as DialogRef<boolean>;
  readonly data = inject(DIALOG_DATA) as ConfirmDialogData;

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
