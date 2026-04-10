import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} Cliente</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-2">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="telefono" type="tel">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="direccion">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Notas</mat-label>
          <textarea matInput formControlName="notas" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (data) {
        <button mat-button color="warn" (click)="eliminar()">
          <mat-icon>delete</mat-icon> Eliminar
        </button>
      }
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
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
