import type { Period } from '../../models/dashboard/period.model';
import type { SelectedDate } from '../../models/dashboard/selected-date.model';

export interface DashboardState {
  selectedPeriod: Period;
  selectedDate: SelectedDate;
}
