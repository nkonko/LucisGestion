import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Customer } from '../../core/models/customer';
import { DIALOG_DATA, DIALOG_REF } from '../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../core/models/dialog/dialog-ref.model';

@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(DIALOG_REF) as DialogRef<Customer | 'delete'>;
  data = inject(DIALOG_DATA) as Customer | null;

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
    this.dialogRef.close('delete');
  }
}