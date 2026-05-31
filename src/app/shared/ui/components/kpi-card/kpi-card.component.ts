import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

export type KpiVariant = 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIconComponent],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly variant = input<KpiVariant>('primary');
  readonly subtitle = input<string | null>(null);

  readonly cardClass = computed(() => `kpi-card--${this.variant()}`);
}
