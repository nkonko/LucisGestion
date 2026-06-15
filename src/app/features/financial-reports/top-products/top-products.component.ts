import { Component, input } from '@angular/core';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';

export interface TopProductItem {
  name: string;
  quantity: number;
  revenue: number;
  margin: number;
}

@Component({
  selector: 'app-top-products',
  imports: [ArsPipe],
  templateUrl: './top-products.component.html',
  styleUrl: './top-products.component.scss',
})
export class TopProductsComponent {
  readonly products = input.required<TopProductItem[]>();
}
