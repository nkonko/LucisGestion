import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { FinancialInsightsService } from '../../core/services/financial-insights.service';

@Component({
  selector: 'app-reports',
  imports: [ArsPipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  private financialInsightsService = inject(FinancialInsightsService);

  readonly insights = this.financialInsightsService.insights;
  readonly productOpportunities = this.financialInsightsService.productOpportunities;
  readonly expenseAnomalies = this.financialInsightsService.expenseAnomalies;
  readonly priorityCustomers = this.financialInsightsService.priorityCustomers;
  readonly selectedMonthKey = this.financialInsightsService.selectedMonthKey;

  readonly hasInsights = computed(() => this.insights().length > 0);
}
