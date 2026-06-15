import { Component, input } from '@angular/core';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';
import { KpiCardComponent } from '../../../shared/ui/components';

@Component({
  selector: 'app-kpi-summary',
  imports: [ArsPipe, KpiCardComponent],
  templateUrl: './kpi-summary.component.html',
  styleUrl: './kpi-summary.component.scss',
})
export class KpiSummaryComponent {
  readonly monthlySales = input.required<number>();
  readonly periodVariableExpenses = input.required<number>();
  readonly periodFixedCosts = input.required<number>();
  readonly netProfit = input.required<number>();
  readonly hasSalesData = input.required<boolean>();
  readonly variableCostRate = input.required<number>();
  readonly fixedCostRate = input.required<number>();
  readonly isProfitable = input.required<boolean>();
  readonly profitRate = input.required<number>();
}
