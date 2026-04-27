import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { DIALOG_REF } from '../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../core/models/dialog/dialog-ref.model';
import { Customer } from '../../core/models/customer';
import { Recipe } from '../../core/models/recipe';

@Component({
  selector: 'app-sale-form',
  imports: [FormsModule, ArsPipe],
  templateUrl: './sale-form.component.html',
  styleUrl: './sale-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleFormComponent {
  private dialogRef = inject(DIALOG_REF) as DialogRef<Sale>;
  readonly recipesStore = inject(RecipesStore);
  private customersStore = inject(CustomersStore);

  items = signal<SaleItem[]>([]);
  customerSearch = '';
  selectedCustomerId = '';
  selectedCustomer: Customer | null = null;
  paymentMethod: PaymentMethod = 'cash';
  notes = '';

  paymentMethods = Object.entries(PAYMENT_METHOD_DISPLAY).map(([key, label]) => ({
    key: key as PaymentMethod,
    label,
  }));

  customers = computed(() => this.customersStore.customers());

  total = computed(() => this.items().reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
  totalCost = computed(() => this.items().reduce((sum, i) => sum + i.quantity * i.unitCost, 0));
  profit = computed(() => this.total() - this.totalCost());

  getItemQuantity(recipeId: string): number {
    return this.items().find((i) => i.recipeId === recipeId)?.quantity ?? 0;
  }

  addItem(recipe: Recipe): void {
    this.items.update((items) => {
      const existing = items.find((i) => i.recipeId === recipe.id);
      if (existing) {
        return items.map((i) => (i.recipeId === recipe.id ? { ...i, quantity: i.quantity + 1 } : i));
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

  decrementItem(recipeId: string): void {
    this.items.update((items) => {
      const item = items.find((i) => i.recipeId === recipeId);
      if (!item) return items;
      if (item.quantity <= 1) return items.filter((i) => i.recipeId !== recipeId);
      return items.map((i) => (i.recipeId === recipeId ? { ...i, quantity: i.quantity - 1 } : i));
    });
  }

  selectCustomerById(customerId: string): void {
    this.selectedCustomerId = customerId;
    this.selectedCustomer = this.customers().find((customer) => customer.id === customerId) ?? null;

    if (this.selectedCustomer) {
      this.customerSearch = this.selectedCustomer.name;
    }
  }

  handleCustomerSearchChange(name: string): void {
    this.customerSearch = name;

    if (!name || name !== this.selectedCustomer?.name) {
      this.selectedCustomer = null;
      this.selectedCustomerId = '';
    }
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
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