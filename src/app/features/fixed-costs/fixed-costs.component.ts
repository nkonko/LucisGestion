import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { FixedCostsStore } from '../../core/store/fixed-costs.store';
import { AuthService } from '../../core/services/auth.service';
import {
  FixedCost,
  CostCategory,
  FREQUENCY_DISPLAY,
  COST_CATEGORY_DISPLAY,
} from '../../core/models/fixed-cost';
import { FixedCostFormComponent } from './fixed-cost-form.component';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { DialogService } from '../../core/services/dialog.service';
import { UiIconComponent } from '../../shared/ui/components';

@Component({
  selector: 'app-fixed-costs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArsPipe, UiIconComponent],
  templateUrl: './fixed-costs.component.html',
  styleUrl: './fixed-costs.component.scss',
})
export class FixedCostsComponent {
  readonly store = inject(FixedCostsStore);
  readonly auth = inject(AuthService);
  private dialog = inject(DialogService);
  private notify = inject(NotificationService);

  groupsByCategory() {
    const costs = this.store.fixedCosts();
    const map = new Map<CostCategory, FixedCost[]>();
    for (const c of costs) {
      const list = map.get(c.category) ?? [];
      list.push(c);
      map.set(c.category, list);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }

  frequencyLabel(f: FixedCost['frequency']): string {
    return FREQUENCY_DISPLAY[f];
  }

  categoryLabel(c: CostCategory): string {
    return COST_CATEGORY_DISPLAY[c];
  }

  monthlyAmount(c: FixedCost): number {
    if (c.frequency === 'weekly') return c.amount * 4;
    return c.amount;
  }

  create(): void {
    const ref = this.dialog.open<null, FixedCost>(FixedCostFormComponent, {
      maxWidth: '480px',
      data: null,
    });
    ref.afterClosed.subscribe(async (result) => {
      if (result) {
        await this.store.createFixedCost(result);
        this.notify.success('Costo fijo agregado');
      }
    });
  }

  edit(cost: FixedCost): void {
    const ref = this.dialog.open<FixedCost, FixedCost | 'delete'>(FixedCostFormComponent, {
      maxWidth: '480px',
      data: cost,
    });
    ref.afterClosed.subscribe(async (result) => {
      if (result === 'delete') {
        await this.store.deleteFixedCost(cost.id!);
        this.notify.success('Costo fijo eliminado');
      } else if (result) {
        await this.store.updateFixedCost(cost.id!, result);
        this.notify.success('Costo fijo actualizado');
      }
    });
  }
}
