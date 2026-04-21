import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { IngredientesStore } from '../../core/store/ingredientes.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-historial-precios',
  standalone: true,
  imports: [MatDialogModule, MatListModule, MatIconModule, MatButtonModule, DatePipe, ArsPipe],
  templateUrl: './historial-precios.component.html',
})
export class HistorialPreciosComponent {
  private store = inject(IngredientesStore);
  data = inject<{ id: string; nombre: string }>(MAT_DIALOG_DATA);

  historial = toSignal(this.store.getHistorialPrecios(this.data.id), { initialValue: [] });
}
