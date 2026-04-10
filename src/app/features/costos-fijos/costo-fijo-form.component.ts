import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import {
  CostoFijo,
  FrecuenciaCosto,
  CategoriaCosto,
  FRECUENCIA_DISPLAY,
  CATEGORIA_COSTO_DISPLAY,
} from '../../core/models';

@Component({
  selector: 'app-costo-fijo-form',
  imports: [
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, FormsModule, CurrencyPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar' : 'Nuevo' }} Costo Fijo</h2>

    <mat-dialog-content class="flex flex-col gap-3">
      <mat-form-field appearance="outline">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="form.nombre" placeholder="Ej: Alquiler local" required>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Descripción (opcional)</mat-label>
        <input matInput [(ngModel)]="form.descripcion" placeholder="Ej: Pago el 1 de cada mes">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Categoría</mat-label>
        <mat-select [(ngModel)]="form.categoria" required>
          @for (c of categorias; track c.key) {
            <mat-option [value]="c.key">{{ c.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Monto</mat-label>
          <input matInput type="number" [(ngModel)]="form.monto" min="0" required>
          <span matPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Frecuencia</mat-label>
          <mat-select [(ngModel)]="form.frecuencia" required>
            @for (f of frecuencias; track f.key) {
              <mat-option [value]="f.key">{{ f.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <p class="text-xs text-gray-400 -mt-1">
        Equivale a <strong>{{ montoMensualEquivalente() | currency:'ARS':'symbol':'1.0-0' }}/mes</strong>
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (isEdit) {
        <button mat-button color="warn" (click)="eliminar()">
          <mat-icon>delete</mat-icon> Eliminar
        </button>
      }
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="!isValid()">
        {{ isEdit ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CostoFijoFormComponent {
  private dialogRef = inject(MatDialogRef<CostoFijoFormComponent>);
  private data: CostoFijo | null = inject(MAT_DIALOG_DATA);

  isEdit = !!this.data;

  form: Omit<CostoFijo, 'id' | 'activo'> = {
    nombre: this.data?.nombre ?? '',
    descripcion: this.data?.descripcion ?? '',
    monto: this.data?.monto ?? 0,
    frecuencia: this.data?.frecuencia ?? 'mensual',
    categoria: this.data?.categoria ?? 'otros',
  };

  frecuencias = Object.entries(FRECUENCIA_DISPLAY).map(([key, label]) => ({
    key: key as FrecuenciaCosto,
    label,
  }));

  categorias = Object.entries(CATEGORIA_COSTO_DISPLAY).map(([key, label]) => ({
    key: key as CategoriaCosto,
    label,
  }));

  montoMensualEquivalente(): number {
    const { monto, frecuencia } = this.form;
    if (frecuencia === 'mensual') return monto;
    if (frecuencia === 'semanal') return monto * 4;
    if (frecuencia === 'anual') return monto / 12;
    return monto;
  }

  isValid(): boolean {
    return !!(this.form.nombre && this.form.monto >= 0 && this.form.frecuencia && this.form.categoria);
  }

  guardar() {
    if (this.isValid()) {
      this.dialogRef.close({ ...this.form, activo: true });
    }
  }

  eliminar() {
    this.dialogRef.close('delete');
  }
}
