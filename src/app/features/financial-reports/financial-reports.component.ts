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

  readonly customersToCare = this.financialInsights.customerImportance;
  readonly hasCustomersToCare = computed(() => this.customersToCare().length > 0);
}
