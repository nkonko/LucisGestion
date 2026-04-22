import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { CostosFijosStore } from '../../core/store/costos-fijos.store';
import { AuthService } from '../../core/services/auth.service';
import {
  CostoFijo,
  FrecuenciaCosto,
  CategoriaCosto,
  FRECUENCIA_DISPLAY,
  CATEGORIA_COSTO_DISPLAY,
} from '../../core/models/costo-fijo';
import { CostoFijoFormComponent } from './costo-fijo-form.component';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-costos-fijos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    ArsPipe,
  ],
  templateUrl: './costos-fijos.component.html',
  styleUrl: './costos-fijos.component.scss',
})
export class CostosFijosComponent {
  readonly store = inject(CostosFijosStore);
  readonly auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

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
        this.notify.success('Costo fijo agregado');
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
        this.notify.success('Costo fijo eliminado');
      } else if (result) {
        await this.store.actualizarCostoFijo(costo.id!, result);
        this.notify.success('Costo fijo actualizado');
      }
    });
  }
}
