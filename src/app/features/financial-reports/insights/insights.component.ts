import { Component, input } from '@angular/core';
import { PercentPipe } from '@angular/common';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';
import { InsightCardComponent } from '../../../shared/ui/components';
import type { ExpenseAnomaly, PriorityCustomer, ProductOpportunity } from '../../../core/models/financial-report';

@Component({
  selector: 'app-financial-insights',
  imports: [ArsPipe, PercentPipe, InsightCardComponent],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.scss',
})
export class InsightsComponent {
  readonly productOpportunities = input.required<ProductOpportunity[]>();
  readonly expenseAnomalies = input.required<ExpenseAnomaly[]>();
  readonly priorityCustomers = input.required<PriorityCustomer[]>();
}
