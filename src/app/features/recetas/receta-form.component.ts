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
import { PasteleriaStore } from '../../core/store';
import {
  Receta,
  RecetaIngrediente,
  CategoriaReceta,
  CATEGORIAS_RECETA_DISPLAY,
} from '../../core/models';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-receta-form',
  standalone: true,
  imports: [
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatAutocompleteModule,
    FormsModule, ArsPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar' : 'Nueva' }} Receta</h2>

    <mat-dialog-content class="flex flex-col gap-3">
      <mat-form-field appearance="outline">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="form.nombre" placeholder="Ej: Torta de chocolate" required>
      </mat-form-field>

      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Categoría</mat-label>
          <mat-select [(ngModel)]="form.categoria" required>
            @for (c of categorias; track c.key) {
              <mat-option [value]="c.key">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rendimiento (unid.)</mat-label>
          <input matInput type="number" [(ngModel)]="form.rendimiento" min="1" required>
        </mat-form-field>
      </div>

      <!-- Ingredientes de la receta -->
      <mat-divider></mat-divider>
      <h3 class="text-sm font-medium">Ingredientes</h3>

      @for (ri of ingredientesReceta(); track ri.ingredienteId; let i = $index) {
        <div class="flex items-center gap-2">
          <span class="flex-1 text-sm">{{ ri.nombre }}</span>
          <mat-form-field appearance="outline" class="w-20" subscriptSizing="dynamic">
            <input matInput type="number" [ngModel]="ri.cantidad"
                   (ngModelChange)="actualizarCantidad(i, $event)" min="0" step="0.1">
          </mat-form-field>
          <span class="text-xs text-gray-500">{{ ri.unidad }}</span>
          <span class="text-xs font-medium w-16 text-right">{{ ri.costoLinea | ars }}</span>
          <button mat-icon-button (click)="quitarIngrediente(i)" color="warn">
            <mat-icon style="font-size: 18px">close</mat-icon>
          </button>
        </div>
      }

      <!-- Agregar ingrediente -->
      <mat-form-field appearance="outline">
        <mat-label>Agregar ingrediente...</mat-label>
        <input matInput [(ngModel)]="busquedaIngrediente"
               [matAutocomplete]="auto"
               placeholder="Buscar ingrediente"
               (input)="filtrarIngredientes()">
        <mat-autocomplete #auto="matAutocomplete" (optionSelected)="agregarIngrediente($event.option.value)">
          @for (ing of ingredientesFiltrados(); track ing.id) {
            <mat-option [value]="ing">{{ ing.nombre }} ({{ ing.precioUnitario | ars }}/{{ ing.unidad }})</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>

      <mat-divider></mat-divider>

      <!-- Cost calculation -->
      <div class="grid grid-cols-3 gap-3 text-center py-2">
        <div>
          <div class="text-xs text-gray-500">Costo total</div>
          <div class="text-lg font-bold text-red-600">{{ costoCalculado() | ars }}</div>
        </div>
        <div>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>Margen %</mat-label>
            <input matInput type="number" [(ngModel)]="form.margenGanancia"
                   min="0" max="1000" (ngModelChange)="recalcular()">
          </mat-form-field>
        </div>
        <div>
          <div class="text-xs text-gray-500">Precio sugerido</div>
          <div class="text-lg font-bold text-green-600">{{ precioSugerido() | ars }}</div>
        </div>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Precio de venta final</mat-label>
        <input matInput type="number" [(ngModel)]="form.precioVenta" min="0">
        <span matPrefix>$&nbsp;</span>
        <mat-hint>Dejalo en blanco para usar el sugerido</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Notas / Instrucciones</mat-label>
        <textarea matInput [(ngModel)]="form.notas" rows="2"></textarea>
      </mat-form-field>
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
  styles: [`
    .w-20 { width: 80px; }
    .w-16 { width: 64px; }
  `],
})
export class RecetaFormComponent {
  private dialogRef = inject(MatDialogRef<RecetaFormComponent>);
  private data: Receta | null = inject(MAT_DIALOG_DATA);
  private store = inject(PasteleriaStore);

  isEdit = !!this.data;
  busquedaIngrediente = '';

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
    this.data?.ingredientes ? [...this.data.ingredientes] : []
  );

  ingredientesFiltrados = signal(this.store.ingredientes());

  categorias = Object.entries(CATEGORIAS_RECETA_DISPLAY).map(([key, label]) => ({ key, label }));

  costoCalculado = computed(() =>
    this.store.calcularCostoReceta(this.ingredientesReceta())
  );

  precioSugerido = computed(() =>
    this.store.calcularPrecioSugerido(this.costoCalculado(), this.form.margenGanancia)
  );

  filtrarIngredientes() {
    const term = this.busquedaIngrediente.toLowerCase();
    const yaAgregados = new Set(this.ingredientesReceta().map(ri => ri.ingredienteId));
    this.ingredientesFiltrados.set(
      this.store.ingredientes().filter(i =>
        !yaAgregados.has(i.id!) && i.nombre.toLowerCase().includes(term)
      )
    );
  }

  agregarIngrediente(ing: any) {
    this.ingredientesReceta.update(list => [
      ...list,
      {
        ingredienteId: ing.id!,
        nombre: ing.nombre,
        cantidad: 1,
        unidad: ing.unidad,
        costoLinea: ing.precioUnitario,
      },
    ]);
    this.busquedaIngrediente = '';
    this.filtrarIngredientes();
  }

  actualizarCantidad(index: number, cantidad: number) {
    this.ingredientesReceta.update(list => {
      const updated = [...list];
      const ing = this.store.ingredientes().find(
        i => i.id === updated[index].ingredienteId
      );
      updated[index] = {
        ...updated[index],
        cantidad,
        costoLinea: Math.round(cantidad * (ing?.precioUnitario ?? 0) * 100) / 100,
      };
      return updated;
    });
  }

  quitarIngrediente(index: number) {
    this.ingredientesReceta.update(list => list.filter((_, i) => i !== index));
    this.filtrarIngredientes();
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
