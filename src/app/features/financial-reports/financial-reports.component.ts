import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { DatePipe } from '@angular/common';
import { FinancialInsightsService } from '../../core/services/financial-insights.service';

@Component({
  selector: 'app-financial-reports',
  imports: [ArsPipe, DatePipe],
  templateUrl: './financial-reports.component.html',
  styleUrl: './financial-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialReportsComponent {
  private financialInsights = inject(FinancialInsightsService);

  readonly selectedMonthKey = this.financialInsights.selectedMonthKey;
  readonly customersToCare = this.financialInsights.customerImportance;
  readonly productOpportunities = this.financialInsights.productOpportunities;
  readonly expenseAnomalies = this.financialInsights.expenseAnomalies;
  readonly priorityCustomers = this.financialInsights.priorityCustomers;

  readonly hasCustomersToCare = computed(() => this.customersToCare().length > 0);
  readonly hasProductOpportunities = computed(() => this.productOpportunities().length > 0);
  readonly hasExpenseAnomalies = computed(() => this.expenseAnomalies().length > 0);
  readonly hasPriorityCustomers = computed(() => this.priorityCustomers().length > 0);
  readonly hasInsights = computed(
    () => this.hasCustomersToCare() || this.hasProductOpportunities() || this.hasExpenseAnomalies() || this.hasPriorityCustomers(),
  );
}
