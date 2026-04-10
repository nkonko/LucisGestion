import { Component, inject } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PasteleriaStore } from '../../core/store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-catalogo-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, ArsPipe],
  template: `
    <div class="flex items-center justify-between mb-2">
      <h2 mat-dialog-title class="!mb-0">Catálogo de Precios</h2>
      <div class="flex gap-1">
        <button mat-icon-button (click)="compartir()" aria-label="Compartir">
          <mat-icon>share</mat-icon>
        </button>
        <button mat-icon-button (click)="imprimir()" aria-label="Imprimir">
          <mat-icon>print</mat-icon>
        </button>
      </div>
    </div>

    <mat-dialog-content>
      <div id="catalogo-content" class="catalogo">
        <div class="text-center mb-4">
          <div class="text-3xl">🧁</div>
          <h3 class="text-lg font-bold">Lucis Pastelería</h3>
          <p class="text-xs text-gray-500">Catálogo de productos</p>
        </div>

        @for (receta of store.recetas(); track receta.id) {
          <div class="catalogo-item">
            <div class="flex justify-between items-center py-2 border-b">
              <div>
                <div class="font-medium">{{ receta.nombre }}</div>
                <div class="text-xs text-gray-400">{{ receta.categoria }}</div>
              </div>
              <div class="text-lg font-bold text-rose-600">
                {{ receta.precioVenta | ars }}
              </div>
            </div>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .catalogo {
      min-width: 280px;
    }

    @media print {
      .catalogo {
        padding: 16px;
      }
    }
  `],
})
export class CatalogoDialogComponent {
  readonly store = inject(PasteleriaStore);

  imprimir() {
    const content = document.getElementById('catalogo-content');
    if (!content) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html><head><title>Catálogo Lucis</title>
      <style>
        body { font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; }
        .item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee; }
        .name { font-weight: 500; }
        .cat { font-size: 12px; color: #888; }
        .price { font-size: 18px; font-weight: bold; color: #e11d48; }
        .header { text-align: center; margin-bottom: 24px; }
        .header h3 { margin: 4px 0; font-size: 20px; }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  async compartir() {
    const recetas = this.store.recetas();
    const text = `🧁 Lucis Pastelería — Catálogo\n\n` +
      recetas.map(r => `• ${r.nombre}: $${r.precioVenta}`).join('\n') +
      `\n\n¡Hacé tu pedido!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Catálogo Lucis', text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Catálogo copiado al portapapeles');
    }
  }
}
