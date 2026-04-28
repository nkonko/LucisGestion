import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RecipesStore } from '../../core/store/recipes.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { DIALOG_REF } from '../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../core/models/dialog/dialog-ref.model';
import { UiIconComponent } from '../../shared/ui/components';

@Component({
  selector: 'app-catalog-dialog',
  imports: [ArsPipe, UiIconComponent],
  templateUrl: './catalog-dialog.component.html',
  styleUrl: './catalog-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogDialogComponent {
  readonly store = inject(RecipesStore);
  private dialogRef = inject(DIALOG_REF) as DialogRef<undefined>;

  close(): void {
    this.dialogRef.close(undefined);
  }

  print(): void {
    const content = document.getElementById('catalog-content');
    if (!content) return;

    const win = window.open('', '_blank');
    if (!win) return;

    const { document: printDocument } = win;
    printDocument.title = 'Catálogo Lucis';

    const style = printDocument.createElement('style');
    style.textContent = `
      body { font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; }
      .item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee; }
      .name { font-weight: 500; }
      .cat { font-size: 12px; color: #888; }
      .price { font-size: 18px; font-weight: bold; color: #e11d48; }
      .header { text-align: center; margin-bottom: 24px; }
      .header h3 { margin: 4px 0; font-size: 20px; }
    `;

    printDocument.head.appendChild(style);
    printDocument.body.innerHTML = '';
    printDocument.body.appendChild(content.cloneNode(true));
    win.print();
  }

  async share(): Promise<void> {
    const recipes = this.store.recipes();
    const text =
      `🧁 Lucis Pastelería — Catálogo\n\n` +
      recipes.map((r) => `• ${r.name}: $${r.salePrice}`).join('\n') +
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
