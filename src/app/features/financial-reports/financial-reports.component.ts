import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-financial-reports',
  templateUrl: './financial-reports.component.html',
  styleUrl: './financial-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialReportsComponent {}
