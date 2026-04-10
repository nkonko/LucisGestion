import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { PasteleriaStore } from '../../core/store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-historial-precios',
  standalone: true,
  imports: [MatDialogModule, MatListModule, MatIconModule, MatButtonModule, DatePipe, ArsPipe],
  template: `
    <h2 mat-dialog-title>Historial de precios — {{ data.nombre }}</h2>
    <mat-dialog-content>
      @if (historial().length === 0) {
        <div class="text-center py-6 text-gray-400">
          <mat-icon style="font-size: 40px; width: 40px; height: 40px">history</mat-icon>
          <p>No hay cambios de precio registrados</p>
        </div>
      } @else {
        <mat-list>
          @for (item of historial(); track item.id) {
            <mat-list-item>
              <mat-icon matListItemIcon
                [class]="item.precioNuevo > item.precioAnterior ? 'text-red-500' : 'text-green-500'">
                {{ item.precioNuevo > item.precioAnterior ? 'trending_up' : 'trending_down' }}
              </mat-icon>
              <span matListItemTitle>
                {{ item.precioAnterior | ars }} → {{ item.precioNuevo | ars }}
              </span>
              <span matListItemLine class="text-xs text-gray-400">
                {{ item.fecha.toDate() | date:'dd/MM/yyyy HH:mm' }}
              </span>
            </mat-list-item>
          }
        </mat-list>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class HistorialPreciosComponent {
  private store = inject(PasteleriaStore);
  data = inject<{ id: string; nombre: string }>(MAT_DIALOG_DATA);

  historial = toSignal(
    this.store.getHistorialPrecios(this.data.id),
    { initialValue: [] }
  );
}
