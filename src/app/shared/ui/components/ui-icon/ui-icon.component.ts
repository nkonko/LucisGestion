import { LucideDynamicIcon } from '@lucide/angular';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UI_ICON_FALLBACK, UI_ICON_MAP } from './ui-icon.constants';

@Component({
  selector: 'ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideDynamicIcon],
  templateUrl: './ui-icon.component.html',
  styleUrl: './ui-icon.component.scss',
})
export class UiIconComponent {
  readonly name = input.required<string>();
  readonly size = input(24);
  readonly decorative = input(false);
  readonly label = input<string | null>(null);
  readonly resolvedIcon = computed(() => UI_ICON_MAP[this.name()] ?? UI_ICON_FALLBACK);
  readonly accessibleLabel = computed(() => (this.decorative() ? null : this.label()));
}
