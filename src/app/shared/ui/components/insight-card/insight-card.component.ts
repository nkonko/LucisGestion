import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

export type InsightVariant = 'opportunity' | 'warning' | 'critical' | 'impact';

@Component({
  selector: 'app-insight-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIconComponent],
  templateUrl: './insight-card.component.html',
  styleUrl: './insight-card.component.scss',
})
export class InsightCardComponent {
  readonly icon = input.required<string>();
  readonly badge = input.required<string>();
  readonly title = input.required<string>();
  readonly variant = input<InsightVariant>('opportunity');

  readonly cardClass = computed(() => `insight-card--${this.variant()}`);
}
