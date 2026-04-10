import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import {
  Ingrediente,
  UnidadMedida,
  CategoriaIngrediente,
  UNIDADES_DISPLAY,
  CATEGORIAS_INGREDIENTE_DISPLAY,
} from '../../core/models';

@Component({
  selector: 'app-ingrediente-form',
  standalone: true,
  imports: [
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar' : 'Nuevo' }} Ingrediente</h2>

    <mat-dialog-content class="flex flex-col gap-3">
      <mat-form-field appearance="outline">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="form.nombre" placeholder="Ej: Harina 000" required>
      </mat-form-field>

      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Unidad</mat-label>
          <mat-select [(ngModel)]="form.unidad" required>
            @for (u of unidades; track u.key) {
              <mat-option [value]="u.key">{{ u.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Categoría</mat-label>
          <mat-select [(ngModel)]="form.categoria" required>
            @for (c of categorias; track c.key) {
              <mat-option [value]="c.key">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Precio por {{ form.unidad || 'unidad' }}</mat-label>
        <input matInput type="number" [(ngModel)]="form.precioUnitario" min="0" required>
        <span matPrefix>$&nbsp;</span>
      </mat-form-field>

      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Stock actual</mat-label>
          <input matInput type="number" [(ngModel)]="form.stockActual" min="0" required>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Stock mínimo</mat-label>
          <input matInput type="number" [(ngModel)]="form.stockMinimo" min="0" required>
        </mat-form-field>
      </div>
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
export class IngredienteFormComponent {
  private dialogRef = inject(MatDialogRef<IngredienteFormComponent>);
  private data: Ingrediente | null = inject(MAT_DIALOG_DATA);

  isEdit = !!this.data;

  form: Omit<Ingrediente, 'id' | 'ultimaCompra' | 'activo'> = {
    nombre: this.data?.nombre ?? '',
    unidad: this.data?.unidad ?? 'kg',
    precioUnitario: this.data?.precioUnitario ?? 0,
    stockActual: this.data?.stockActual ?? 0,
    stockMinimo: this.data?.stockMinimo ?? 1,
    categoria: this.data?.categoria ?? 'otros',
  };

  unidades = Object.entries(UNIDADES_DISPLAY).map(([key, label]) => ({ key, label }));
  categorias = Object.entries(CATEGORIAS_INGREDIENTE_DISPLAY).map(([key, label]) => ({ key, label }));

  isValid(): boolean {
    return !!(this.form.nombre && this.form.unidad && this.form.precioUnitario >= 0);
  }

  guardar() {
    if (this.isValid()) {
      this.dialogRef.close({
        ...this.form,
        ultimaCompra: null,
        activo: true,
      });
    }
  }

  eliminar() {
    this.dialogRef.close('delete');
  }
}
