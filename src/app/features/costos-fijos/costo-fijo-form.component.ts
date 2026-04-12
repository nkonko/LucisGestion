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
  CostoFijoInputForm,
} from '../../core/models/costo-fijo.model';

@Component({
  selector: 'app-costo-fijo-form',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    CurrencyPipe,
  ],
  templateUrl: './costo-fijo-form.component.html',
})
export class CostoFijoFormComponent {
  private dialogRef = inject(MatDialogRef<CostoFijoFormComponent>);
  private data: CostoFijo | null = inject(MAT_DIALOG_DATA);

  isEdit = !!this.data;

  form: CostoFijoInputForm = {
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
    return !!(
      this.form.nombre &&
      this.form.monto >= 0 &&
      this.form.frecuencia &&
      this.form.categoria
    );
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
