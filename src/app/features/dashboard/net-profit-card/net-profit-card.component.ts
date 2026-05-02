import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-net-profit-card',
  imports: [ArsPipe],
  templateUrl: './net-profit-card.component.html',
  styleUrl: './net-profit-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetProfitCardComponent {
  periodLabel = input('Este mes');
  income = input(0);
  variableCosts = input(0);
  fixedCosts = input(0);
  netProfit = input(0);

  totalCosts = computed(() => this.variableCosts() + this.fixedCosts());
}
