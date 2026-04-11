import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Cliente } from '../../core/models/cliente.model';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './cliente-form.component.html',
})
export class ClienteFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ClienteFormComponent>);
  data = inject<Cliente | null>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    nombre: [this.data?.nombre ?? '', Validators.required],
    telefono: [this.data?.telefono ?? ''],
    direccion: [this.data?.direccion ?? ''],
    notas: [this.data?.notas ?? ''],
  });

  guardar() {
    if (this.form.invalid) return;
    this.dialogRef.close({
      ...this.form.getRawValue(),
      totalCompras: this.data?.totalCompras ?? 0,
      ultimaCompra: this.data?.ultimaCompra ?? null,
    });
  }

  eliminar() {
    this.dialogRef.close('delete');
  }
}
