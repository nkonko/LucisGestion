import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterLink } from '@angular/router';
import { DashboardStore, Periodo } from '../../core/store/dashboard.store';
import { IngredientesStore } from '../../core/store/ingredientes.store';
import { VentasStore } from '../../core/store/ventas.store';
import { RecetasStore } from '../../core/store/recetas.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatButtonToggleModule,
    RouterLink,
    ArsPipe,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly store = inject(DashboardStore);
  private ingredientesStore = inject(IngredientesStore);
  private ventasStore = inject(VentasStore);
  private recetasStore = inject(RecetasStore);

  stockBajo = this.ingredientesStore.stockBajo;
  totalRecetas = this.recetasStore.totalRecetas;
  ventasRecientes = this.ventasStore.ventasRecientes;
  pedidosPendientes = this.ventasStore.pedidosPendientesCount;
  ventasMes = this.store.ventasMes;
  gastosMes = this.store.gastosMes;
  gananciaMes = this.store.gananciaMes;
  costosFijosPeriodo = this.store.costosFijosPeriodo;
  gastosTotalesPeriodo = this.store.gastosTotalesPeriodo;
  gananciaNeta = this.store.gananciaNeta;

  ingresosBarWidth = computed(() => {
    const max = Math.max(this.ventasMes(), this.gastosTotalesPeriodo(), 1);
    return (this.ventasMes() / max) * 100;
  });

  ingredientesBarWidth = computed(() => {
    const max = Math.max(this.ventasMes(), this.gastosTotalesPeriodo(), 1);
    return (this.gastosMes() / max) * 100;
  });

  costosFijosBarWidth = computed(() => {
    const max = Math.max(this.ventasMes(), this.gastosTotalesPeriodo(), 1);
    return (this.costosFijosPeriodo() / max) * 100;
  });

  gastosBarWidth = computed(() => {
    const max = Math.max(this.ventasMes(), this.gastosTotalesPeriodo(), 1);
    return (this.gastosTotalesPeriodo() / max) * 100;
  });
}
