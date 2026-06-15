import { Component, input } from '@angular/core';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';

export interface TopCustomerItem {
  name: string;
  revenue: number;
  share: number;
  ordersCount: number;
}

@Component({
  selector: 'app-top-customers',
  imports: [ArsPipe],
  templateUrl: './top-customers.component.html',
  styleUrl: './top-customers.component.scss',
})
export class TopCustomersComponent {
  readonly customers = input.required<TopCustomerItem[]>();
}
