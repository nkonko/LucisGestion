import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DashboardStore } from '../../core/store/dashboard.store';
import { FinancialExportService } from '../../core/services/financial-export.service';
import type { ExportDatasetKey } from '../../core/models/financial-report';
import { MonthNavComponent } from '../../shared/month-nav/month-nav.component';

interface ExportOption {
  key: ExportDatasetKey;
  label: string;
}

@Component({
  selector: 'app-financial-reports',
  imports: [MonthNavComponent],
  templateUrl: './financial-reports.component.html',
  styleUrl: './financial-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialReportsComponent {
  readonly dashboardStore = inject(DashboardStore);
  private readonly financialExportService = inject(FinancialExportService);

  readonly periodLabel = this.dashboardStore.periodLabel;
  readonly monthInputValue = this.dashboardStore.monthInputValue;
  readonly isCurrentMonth = this.dashboardStore.isCurrentMonth;
  readonly selectedDate = this.dashboardStore.selectedDate;

  readonly exportOptions: ExportOption[] = [
    { key: 'insights', label: 'Insights financieros' },
    { key: 'salesByProduct', label: 'Ventas por producto' },
    { key: 'expensesByCategory', label: 'Gastos por categoría' },
    { key: 'keyCustomers', label: 'Clientes clave' },
  ];

  readonly selectedDatasets = signal<ExportDatasetKey[]>([]);
  readonly isExportEnabled = computed(() => this.selectedDatasets().length > 0);
  readonly maxMonth = (() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  })();

  onDatasetToggle(dataset: ExportDatasetKey, checked: boolean): void {
    if (checked) {
      this.selectedDatasets.update((datasets) => [...new Set([...datasets, dataset])]);
      return;
    }
    this.selectedDatasets.update((datasets) => datasets.filter((item) => item !== dataset));
  }

  onDatasetChange(event: Event, dataset: ExportDatasetKey): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.onDatasetToggle(dataset, target.checked);
  }

  onMonthInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const [yearText, monthText] = input.value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return;
    }
    this.dashboardStore.setSelectedDate({ year, month: month - 1 });
  }

  async export(): Promise<void> {
    if (!this.isExportEnabled()) {
      return;
    }

    const { year, month } = this.selectedDate();
    await this.financialExportService.exportExcel({
      datasets: this.selectedDatasets(),
      period: new Date(year, month, 1),
    });
  }
}
