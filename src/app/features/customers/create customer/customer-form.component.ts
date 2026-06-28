import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Customer, CustomerInput } from '../../../core/models/customer';
import { DIALOG_DATA, DIALOG_REF } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';
import { UiIconComponent } from '../../../shared/ui/components';
import { BottomSheetService } from '../../../core/services/bottom-sheet.service';
import { ConfirmBottomSheetDialogComponent } from '../../../shared/ui-bottom-sheet/confirm-dialog/confirm-bottom-sheet-dialog.component';
import { ConfirmDialogData } from '../../../shared/ui-bottom-sheet/confirm-dialog/confirm-dialog-data.model';

@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, UiIconComponent],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(DIALOG_REF) as DialogRef<CustomerInput | 'delete'>;
  data = inject(DIALOG_DATA) as Customer | null;
  private bottomSheet = inject(BottomSheetService);

  form = this.fb.nonNullable.group({
    name: [this.data?.name ?? '', Validators.required],
    phone: [this.data?.phone ?? ''],
    address: [this.data?.address ?? ''],
    notes: [this.data?.notes ?? ''],
  });

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close({
      ...this.form.getRawValue(),
      totalPurchases: this.data?.totalPurchases ?? 0,
      lastPurchase: this.data?.lastPurchase ?? null,
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  remove(): void {
    const ref = this.bottomSheet.open<ConfirmDialogData, boolean>(
      ConfirmBottomSheetDialogComponent,
      {
        maxWidth: '420px',
        data: {
          title: 'Eliminar cliente',
          message: '¿Seguro que querés eliminar este cliente? Las ventas asociadas mostrarán "[eliminado]" como nombre.',
          confirmLabel: 'Eliminar',
          destructive: true,
        },
      },
    );
    ref.afterClosed.subscribe((confirmed) => {
      if (confirmed) {
        this.dialogRef.close('delete');
      }
    });
  }
}