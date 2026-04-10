import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterLink } from '@angular/router';
import { PasteleriaStore, Periodo } from '../../core/store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatListModule, MatChipsModule,
    MatButtonToggleModule, RouterLink, ArsPipe,
  ],
  template: `
    <h2 class="text-xl font-semibold mb-4">Hola! 👋</h2>

    <!-- Period Selector -->
    <mat-button-toggle-group
      class="mb-4 w-full"
      [value]="store.periodoSeleccionado()"
      (change)="store.setPeriodo($event.value)">
      <mat-button-toggle value="hoy" class="flex-1">Hoy</mat-button-toggle>
      <mat-button-toggle value="semana" class="flex-1">Semana</mat-button-toggle>
      <mat-button-toggle value="mes" class="flex-1">Mes</mat-button-toggle>
    </mat-button-toggle-group>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 gap-3 mb-6">
      <mat-card class="touch-card">
        <mat-card-content class="text-center py-3">
          <mat-icon class="text-green-600">trending_up</mat-icon>
          <div class="text-2xl font-bold">{{ ventasMes() | ars }}</div>
          <div class="text-xs text-gray-500">Ingresos</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="touch-card">
        <mat-card-content class="text-center py-3">
          <mat-icon class="text-blue-600">savings</mat-icon>
          <div class="text-2xl font-bold">{{ gananciaMes() | ars }}</div>
          <div class="text-xs text-gray-500">Ganancia</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="touch-card" routerLink="/recetas">
        <mat-card-content class="text-center py-3">
          <mat-icon class="text-purple-600">menu_book</mat-icon>
          <div class="text-2xl font-bold">{{ totalRecetas() }}</div>
          <div class="text-xs text-gray-500">Recetas activas</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="touch-card" routerLink="/ventas">
        <mat-card-content class="text-center py-3">
          <mat-icon class="text-orange-600">pending_actions</mat-icon>
          <div class="text-2xl font-bold">{{ pedidosPendientes() }}</div>
          <div class="text-xs text-gray-500">Pedidos pendientes</div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Producto más vendido -->
    @if (store.productoMasVendido(); as top) {
      <mat-card class="mb-4 touch-card">
        <mat-card-content class="flex items-center gap-3 py-2">
          <mat-icon class="text-amber-500" style="font-size: 32px; width: 32px; height: 32px">emoji_events</mat-icon>
          <div>
            <div class="text-xs text-gray-500">Más vendido</div>
            <div class="font-bold">{{ top.nombre }}</div>
            <div class="text-sm text-gray-400">{{ top.cantidad }} unidades</div>
          </div>
        </mat-card-content>
      </mat-card>
    }

    <!-- Ingresos vs Gastos Bar -->
    <h3 class="text-base font-medium mb-2">Ingresos vs Costos</h3>
    <mat-card class="mb-4">
      <mat-card-content class="py-3">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs w-16 text-gray-500">Ingresos</span>
          <div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div class="bg-green-500 h-5 rounded-full transition-all"
                 [style.width.%]="ingresosBarWidth()"></div>
          </div>
          <span class="text-xs w-24 text-right font-medium">{{ ventasMes() | ars }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs w-16 text-gray-500">Costos</span>
          <div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div class="bg-red-400 h-5 rounded-full transition-all"
                 [style.width.%]="gastosBarWidth()"></div>
          </div>
          <span class="text-xs w-24 text-right font-medium">{{ gastosMes() | ars }}</span>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Stock Alerts -->
    @if (stockBajo().length > 0) {
      <h3 class="text-base font-medium mb-2">
        <mat-icon class="text-red-500 align-middle" style="font-size: 20px">warning</mat-icon>
        Stock bajo
      </h3>
      <mat-card class="mb-4">
        <mat-list>
          @for (item of stockBajo(); track item.id) {
            <mat-list-item>
              <mat-icon matListItemIcon class="stock-danger">error</mat-icon>
              <span matListItemTitle>{{ item.nombre }}</span>
              <span matListItemLine>
                Quedan {{ item.stockActual }} {{ item.unidad }} (mín: {{ item.stockMinimo }})
              </span>
            </mat-list-item>
          }
        </mat-list>
      </mat-card>
    }

    <!-- Recent Sales -->
    @if (ventasRecientes().length > 0) {
      <h3 class="text-base font-medium mb-2">Últimas ventas</h3>
      <mat-card>
        <mat-list>
          @for (venta of ventasRecientes(); track venta.id) {
            <mat-list-item>
              <mat-icon matListItemIcon>receipt</mat-icon>
              <span matListItemTitle>{{ venta.clienteNombre || 'Sin cliente' }} — {{ venta.total | ars }}</span>
              <span matListItemLine>
                <mat-chip-set>
                  <mat-chip [class]="venta.estado === 'pendiente' ? 'stock-warning' : 'stock-ok'"
                            style="font-size: 11px">
                    {{ venta.estado }}
                  </mat-chip>
                </mat-chip-set>
              </span>
            </mat-list-item>
          }
        </mat-list>
      </mat-card>
    }
  `,
})
export class DashboardComponent {
  readonly store = inject(PasteleriaStore);

  stockBajo = this.store.stockBajo;
  totalRecetas = this.store.totalRecetas;
  ventasRecientes = this.store.ventasRecientes;
  pedidosPendientes = this.store.pedidosPendientesCount;
  ventasMes = this.store.ventasMes;
  gastosMes = this.store.gastosMes;
  gananciaMes = this.store.gananciaMes;

  ingresosBarWidth = computed(() => {
    const max = Math.max(this.ventasMes(), this.gastosMes(), 1);
    return (this.ventasMes() / max) * 100;
  });

  gastosBarWidth = computed(() => {
    const max = Math.max(this.ventasMes(), this.gastosMes(), 1);
    return (this.gastosMes() / max) * 100;
  });
}
