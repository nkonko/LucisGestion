import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification.service';
import { RecetasStore } from '../../core/store/recetas.store';
import { Receta } from '../../core/models/receta';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { RecetaFormComponent } from './receta-form.component';
import { CatalogoDialogComponent } from './catalogo-dialog.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    ArsPipe,
  ],
  templateUrl: './recetas.component.html',
})
export class RecetasComponent {
  readonly store = inject(RecetasStore);
  readonly auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  crear() {
    const dialogRef = this.dialog.open(RecetaFormComponent, {
      width: '100%',
      maxWidth: '560px',
      maxHeight: '90vh',
      data: null,
    });

    dialogRef.afterClosed().subscribe(async (result: Receta | undefined) => {
      if (result) {
        await this.store.crearReceta(result);
        this.notify.success('Receta creada');
      }
    });
  }

  editar(receta: Receta) {
    const dialogRef = this.dialog.open(RecetaFormComponent, {
      width: '100%',
      maxWidth: '560px',
      maxHeight: '90vh',
      data: receta,
    });

    dialogRef.afterClosed().subscribe(async (result: Receta | 'delete' | undefined) => {
      if (result === 'delete') {
        await this.store.eliminarReceta(receta.id!);
        this.notify.success('Receta eliminada');
      } else if (result) {
        await this.store.actualizarReceta(receta.id!, result);
        this.notify.success('Receta actualizada');
      }
    });
  }

  async duplicar(receta: Receta) {
    await this.store.duplicarReceta(receta);
    this.notify.success('Receta duplicada');
  }

  verCatalogo() {
    this.dialog.open(CatalogoDialogComponent, {
      width: '100%',
      maxWidth: '600px',
      maxHeight: '90vh',
    });
  }
}
