import { Component, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule } from '@angular/forms';
import { IngredientesStore } from '../../core/store/ingredientes.store';
import { calcularCostoReceta, calcularPrecioSugerido } from '../../core/utils/precio.utils';
import { Receta, CategoriaReceta, CATEGORIAS_RECETA_DISPLAY } from '../../core/models/receta';
import { RecetaIngrediente } from '../../core/models/ingrediente';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-receta-form',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatAutocompleteModule,
    FormsModule,
    ArsPipe,
  ],
  templateUrl: './receta-form.component.html',
  styles: [
    `
      .w-20 {
        width: 80px;
      }
      .w-16 {
        width: 64px;
      }
    `,
  ],
})
export class RecetaFormComponent {
  private dialogRef = inject(MatDialogRef<RecetaFormComponent>);
  private data: Receta | null = inject(MAT_DIALOG_DATA);
  private ingredientesStore = inject(IngredientesStore);

  isEdit = !!this.data;
  busquedaIngrediente = signal('');

  form = {
    nombre: this.data?.nombre ?? '',
    categoria: (this.data?.categoria ?? 'tortas') as CategoriaReceta,
    rendimiento: this.data?.rendimiento ?? 1,
    margenGanancia: this.data?.margenGanancia ?? 60,
    precioVenta: this.data?.precioVenta ?? 0,
    notas: this.data?.notas ?? '',
    imagenUrl: this.data?.imagenUrl ?? '',
  };

  ingredientesReceta = signal<RecetaIngrediente[]>(
    this.data?.ingredientes ? [...this.data.ingredientes] : [],
  );

  ingredientesFiltrados = computed(() => {
    const term = this.busquedaIngrediente().toLowerCase();
    const yaAgregados = new Set(this.ingredientesReceta().map((ri) => ri.ingredienteId));
    return this.ingredientesStore
      .ingredientes()
      .filter((i) => !yaAgregados.has(i.id!) && i.nombre.toLowerCase().includes(term));
  });

  categorias = Object.entries(CATEGORIAS_RECETA_DISPLAY).map(([key, label]) => ({ key, label }));

  costoCalculado = computed(() =>
    calcularCostoReceta(this.ingredientesReceta(), this.ingredientesStore.ingredientes()),
  );

  precioSugerido = computed(() =>
    calcularPrecioSugerido(this.costoCalculado(), this.form.margenGanancia),
  );

  agregarIngrediente(ing: any) {
    this.ingredientesReceta.update((list) => [
      ...list,
      {
        ingredienteId: ing.id!,
        nombre: ing.nombre,
        cantidad: 1,
        unidad: ing.unidad,
        costoLinea: ing.precioUnitario,
      },
    ]);
    this.busquedaIngrediente.set('');
  }

  actualizarCantidad(index: number, cantidad: number) {
    this.ingredientesReceta.update((list) => {
      const updated = [...list];
      const ing = this.ingredientesStore
        .ingredientes()
        .find((i) => i.id === updated[index].ingredienteId);
      updated[index] = {
        ...updated[index],
        cantidad,
        costoLinea: Math.round(cantidad * (ing?.precioUnitario ?? 0) * 100) / 100,
      };
      return updated;
    });
  }

  quitarIngrediente(index: number) {
    this.ingredientesReceta.update((list) => list.filter((_, i) => i !== index));
  }

  recalcular() {
    // Triggers computed signals automatically
  }

  isValid(): boolean {
    return !!(this.form.nombre && this.ingredientesReceta().length > 0);
  }

  guardar() {
    if (!this.isValid()) return;

    const costo = this.costoCalculado();
    const sugerido = this.precioSugerido();

    this.dialogRef.close({
      ...this.form,
      ingredientes: this.ingredientesReceta(),
      costoCalculado: costo,
      precioSugerido: sugerido,
      precioVenta: this.form.precioVenta || sugerido,
      activo: true,
    } as Receta);
  }

  eliminar() {
    this.dialogRef.close('delete');
  }
}
