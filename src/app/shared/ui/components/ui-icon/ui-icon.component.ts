import {
  LucideBookOpenText,
  LucideCalculator,
  LucideCircleAlert,
  LucideCircleCheckBig,
  LucideCopy,
  LucideCreditCard,
  LucideDynamicIcon,
  LucideEgg,
  LucideEllipsisVertical,
  LucideHistory,
  LucideHouse,
  LucideList,
  LucideListTodo,
  LucideLogOut,
  LucideMapPin,
  LucideMessageCircle,
  LucidePackage2,
  LucidePhone,
  LucidePiggyBank,
  LucidePlus,
  LucidePrinter,
  LucideReceipt,
  LucideReceiptText,
  LucideShare2,
  LucideTrendingUp,
  LucideTriangleAlert,
  LucideTrophy,
  LucideUserRound,
  LucideUsers,
  type LucideIconData,
} from '@lucide/angular';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const ICON_MAP: Record<string, LucideIconData> = {
  account_circle: LucideUserRound.icon,
  add: LucidePlus.icon,
  calculate: LucideCalculator.icon,
  chat: LucideMessageCircle.icon,
  check_circle: LucideCircleCheckBig.icon,
  content_copy: LucideCopy.icon,
  egg: LucideEgg.icon,
  emoji_events: LucideTrophy.icon,
  error: LucideCircleAlert.icon,
  history: LucideHistory.icon,
  home: LucideHouse.icon,
  inventory_2: LucidePackage2.icon,
  list: LucideList.icon,
  logout: LucideLogOut.icon,
  menu_book: LucideBookOpenText.icon,
  more_vert: LucideEllipsisVertical.icon,
  pending_actions: LucideListTodo.icon,
  people: LucideUsers.icon,
  phone: LucidePhone.icon,
  place: LucideMapPin.icon,
  point_of_sale: LucideCreditCard.icon,
  print: LucidePrinter.icon,
  receipt: LucideReceipt.icon,
  receipt_long: LucideReceiptText.icon,
  savings: LucidePiggyBank.icon,
  share: LucideShare2.icon,
  trending_up: LucideTrendingUp.icon,
  warning: LucideTriangleAlert.icon,
};

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
  readonly resolvedIcon = computed(() => ICON_MAP[this.name()] ?? LucideCircleAlert.icon);
  readonly accessibleLabel = computed(() => (this.decorative() ? null : this.label()));
}
