import { UiToastKind } from './ui-toast-kind.model';

export interface UiToastItem {
  id: string;
  message: string;
  kind: UiToastKind;
  duration: number;
  icon?: string;
  dismissing?: boolean;
}
