import { Component, inject } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RecetasStore } from '../../core/store/recetas.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-catalogo-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, ArsPipe],
  templateUrl: './catalogo-dialog.component.html',
  styles: [
    `
      .catalogo {
        min-width: 280px;
      }

      @media print {
        .catalogo {
          padding: 16px;
        }
      }
    `,
  ],
})
export class CatalogoDialogComponent {
  readonly store = inject(RecetasStore);

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
    const text =
      `🧁 Lucis Pastelería — Catálogo\n\n` +
      recetas.map((r) => `• ${r.nombre}: $${r.precioVenta}`).join('\n') +
      `\n\n¡Hacé tu pedido!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Catálogo Lucis', text });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Catálogo copiado al portapapeles');
    }
  }
}
