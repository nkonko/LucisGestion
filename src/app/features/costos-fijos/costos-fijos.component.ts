import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PasteleriaStore } from '../../core/store';
import { AuthService } from '../../core/services/auth.service';
import { CostoFijo, FrecuenciaCosto, CategoriaCosto, FRECUENCIA_DISPLAY, CATEGORIA_COSTO_DISPLAY } from '../../core/models';
import { CostoFijoFormComponent } from './costo-fijo-form.component';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-costos-fijos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatDialogModule, MatSnackBarModule, ArsPipe,
  ],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Costos Fijos</h2>
    </div>

    <!-- Resumen mensual -->
    <mat-card class="mb-4 bg-orange-50">
      <mat-card-content class="py-3">
        <div class="flex items-center gap-2 mb-1">
          <mat-icon class="text-orange-500">calculate</mat-icon>
          <span class="font-medium text-orange-800">Total mensual estimado</span>
        </div>
        <div class="text-2xl font-bold text-orange-700">
          {{ store.totalCostosFijosMensuales() | ars }}
        </div>
        <div class="text-xs text-orange-600 mt-1">
          Suma de todos los costos convertidos a mensual
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Lista vacía -->
    @if (store.costosFijos().length === 0) {
      <div class="text-center py-8 text-gray-400">
        <mat-icon style="font-size: 48px; width: 48px; height: 48px">receipt_long</mat-icon>
        <p>No hay costos fijos cargados</p>
        <p class="text-sm">Tocá el botón + para agregar luz, gas, alquiler, etc.</p>
      </div>
    }

    <!-- Agrupado por categoría -->
    @for (grupo of gruposPorCategoria(); track grupo.categoria) {
      <div class="mb-2">
        <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-1">
          {{ labelCategoria(grupo.categoria) }}
        </div>
        @for (costo of grupo.items; track costo.id) {
          <mat-card class="touch-card mb-2" (click)="auth.isOwner() ? editar(costo) : null">
            <mat-card-content class="py-2">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{{ costo.nombre }}</div>
                  @if (costo.descripcion) {
                    <div class="text-xs text-gray-500 truncate">{{ costo.descripcion }}</div>
                  }
                </div>
                <div class="text-right ml-3 shrink-0">
                  <div class="font-semibold text-orange-700">{{ costo.monto | ars }}</div>
                  <mat-chip-set>
                    <mat-chip class="text-xs">{{ labelFrecuencia(costo.frecuencia) }}</mat-chip>
                  </mat-chip-set>
                </div>
              </div>
              @if (costo.frecuencia !== 'mensual') {
                <div class="text-xs text-gray-400 mt-1">
                  ≈ {{ montoMensual(costo) | ars }}/mes
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      </div>
    }

    @if (auth.isOwner()) {
      <button mat-fab class="fab-bottom-right" color="primary" (click)="crear()"
              aria-label="Agregar costo fijo">
        <mat-icon>add</mat-icon>
      </button>
    }
  `,
})
export class CostosFijosComponent {
  readonly store = inject(PasteleriaStore);
  readonly auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  gruposPorCategoria() {
    const costos = this.store.costosFijos();
    const map = new Map<CategoriaCosto, CostoFijo[]>();
    for (const c of costos) {
      const lista = map.get(c.categoria) ?? [];
      lista.push(c);
      map.set(c.categoria, lista);
    }
    return Array.from(map.entries()).map(([categoria, items]) => ({ categoria, items }));
  }

  labelFrecuencia(f: CostoFijo['frecuencia']): string {
    return FRECUENCIA_DISPLAY[f];
  }

  labelCategoria(c: CategoriaCosto): string {
    return CATEGORIA_COSTO_DISPLAY[c];
  }

  montoMensual(c: CostoFijo): number {
    if (c.frecuencia === 'semanal') return c.monto * 4;
    return c.monto;
  }

  crear() {
    const ref = this.dialog.open(CostoFijoFormComponent, {
      width: '100%',
      maxWidth: '480px',
      data: null,
    });
    ref.afterClosed().subscribe(async (result: CostoFijo | undefined) => {
      if (result) {
        await this.store.crearCostoFijo(result);
        this.snackBar.open('Costo fijo agregado', 'OK', { duration: 2000 });
      }
    });
  }

  editar(costo: CostoFijo) {
    const ref = this.dialog.open(CostoFijoFormComponent, {
      width: '100%',
      maxWidth: '480px',
      data: costo,
    });
    ref.afterClosed().subscribe(async (result: CostoFijo | 'delete' | undefined) => {
      if (result === 'delete') {
        await this.store.eliminarCostoFijo(costo.id!);
        this.snackBar.open('Costo fijo eliminado', 'OK', { duration: 2000 });
      } else if (result) {
        await this.store.actualizarCostoFijo(costo.id!, result);
        this.snackBar.open('Costo fijo actualizado', 'OK', { duration: 2000 });
      }
    });
  }
}
