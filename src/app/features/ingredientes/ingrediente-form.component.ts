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
  IngredienteInputForm,
} from '../../core/models/ingrediente';

@Component({
  selector: 'app-ingrediente-form',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: './ingrediente-form.component.html',
})
export class IngredienteFormComponent {
  private dialogRef = inject(MatDialogRef<IngredienteFormComponent>);
  private data: Ingrediente | null = inject(MAT_DIALOG_DATA);

  isEdit = !!this.data;

  form: IngredienteInputForm = {
    nombre: this.data?.nombre ?? '',
    unidad: this.data?.unidad ?? 'kg',
    precioUnitario: this.data?.precioUnitario ?? 0,
    stockActual: this.data?.stockActual ?? 0,
    stockMinimo: this.data?.stockMinimo ?? 1,
    categoria: this.data?.categoria ?? 'otros',
  };

  unidades = Object.entries(UNIDADES_DISPLAY).map(([key, label]) => ({ key, label }));
  categorias = Object.entries(CATEGORIAS_INGREDIENTE_DISPLAY).map(([key, label]) => ({
    key,
    label,
  }));

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
