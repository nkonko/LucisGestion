import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Customer } from '../../core/models/customer';

@Component({
  selector: 'app-customer-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './customer-form.component.html',
})
export class CustomerFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CustomerFormComponent>);
  data = inject<Customer | null>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    name: [this.data?.name ?? '', Validators.required],
    phone: [this.data?.phone ?? ''],
    address: [this.data?.address ?? ''],
    notes: [this.data?.notes ?? ''],
  });

  save() {
    if (this.form.invalid) return;
    this.dialogRef.close({
      ...this.form.getRawValue(),
      totalPurchases: this.data?.totalPurchases ?? 0,
      lastPurchase: this.data?.lastPurchase ?? null,
    });
  }

  remove() {
    this.dialogRef.close('delete');
  }
}
