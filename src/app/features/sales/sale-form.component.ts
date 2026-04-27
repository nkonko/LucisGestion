import { Component, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule } from '@angular/forms';
import { RecipesStore } from '../../core/store/recipes.store';
import { CustomersStore } from '../../core/store/customers.store';
import {
  Sale,
  SaleItem,
  PaymentMethod,
  PAYMENT_METHOD_DISPLAY,
  SaleInput,
} from '../../core/models/sale';
import { Timestamp } from '@angular/fire/firestore';
import { ArsPipe } from '../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-sale-form',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatAutocompleteModule,
    FormsModule,
    ArsPipe,
  ],
  templateUrl: './sale-form.component.html',
  styleUrl: './sale-form.component.scss',
})
export class SaleFormComponent {
  private dialogRef = inject(MatDialogRef<SaleFormComponent>);
  readonly recipesStore = inject(RecipesStore);
  private customersStore = inject(CustomersStore);

  items = signal<SaleItem[]>([]);
  customerSearch = '';
  selectedCustomer: any = null;
  paymentMethod: PaymentMethod = 'cash';
  notes = '';

  paymentMethods = Object.entries(PAYMENT_METHOD_DISPLAY).map(([key, label]) => ({ key, label }));

  filteredCustomers = computed(() => {
    const term = this.customerSearch?.toLowerCase() ?? '';
    return this.customersStore
      .customers()
      .filter((c) => c.name.toLowerCase().includes(term) || c.phone.includes(term));
  });

  total = computed(() => this.items().reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
  totalCost = computed(() =>
    this.items().reduce((sum, i) => sum + i.quantity * i.unitCost, 0),
  );
  profit = computed(() => this.total() - this.totalCost());

  getItemQuantity(recipeId: string): number {
    return this.items().find((i) => i.recipeId === recipeId)?.quantity ?? 0;
  }

  addItem(recipe: any) {
    this.items.update((items) => {
      const existing = items.find((i) => i.recipeId === recipe.id);
      if (existing) {
        return items.map((i) =>
          i.recipeId === recipe.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...items,
        {
          recipeId: recipe.id!,
          name: recipe.name,
          quantity: 1,
          unitPrice: recipe.salePrice,
          unitCost: recipe.calculatedCost,
        },
      ];
    });
  }

  decrementItem(recipeId: string) {
    this.items.update((items) => {
      const item = items.find((i) => i.recipeId === recipeId);
      if (!item) return items;
      if (item.quantity <= 1) return items.filter((i) => i.recipeId !== recipeId);
      return items.map((i) => (i.recipeId === recipeId ? { ...i, quantity: i.quantity - 1 } : i));
    });
  }

  selectCustomer(customer: any) {
    this.selectedCustomer = customer;
    this.customerSearch = customer.name;
  }

  displayCustomer(c: any): string {
    return c?.name ?? '';
  }

  confirm() {
    if (this.items().length === 0) return;

    const sale: SaleInput = {
      date: Timestamp.now(),
      customerId: this.selectedCustomer?.id ?? null,
      customerName: this.selectedCustomer?.name ?? this.customerSearch ?? '',
      items: this.items(),
      total: this.total(),
      totalCost: this.totalCost(),
      profit: this.profit(),
      paymentMethod: this.paymentMethod,
      status: 'pending',
      notes: this.notes,
    };

    this.dialogRef.close(sale);
  }
}
