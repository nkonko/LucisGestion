import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecipesStore } from '../../../core/store/recipes.store';
import { CustomersStore } from '../../../core/store/customers.store';
import {
  Sale,
  SaleItem,
  PaymentMethod,
  PAYMENT_METHOD_DISPLAY,
  SaleInput,
} from '../../../core/models/sale';
import { Timestamp } from '@angular/fire/firestore';
import { DIALOG_REF, DIALOG_DATA } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';
import { Customer } from '../../../core/models/customer';
import { Recipe } from '../../../core/models/recipe';
import { SaleProductItemComponent } from './product-item/sale-product-item.component';

@Component({
  selector: 'app-sale-form',
  imports: [FormsModule, SaleProductItemComponent],
  templateUrl: './sale-form.component.html',
  styleUrl: './sale-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleFormComponent {
  private dialogRef = inject(DIALOG_REF) as DialogRef<SaleInput>;
  private dialogData = inject(DIALOG_DATA) as Sale | null;
  readonly recipesStore = inject(RecipesStore);
  private customersStore = inject(CustomersStore);

  private readonly existingSale = signal<Sale | null>(this.dialogData);
  readonly isEdit = computed(() => this.existingSale() !== null);
  readonly pageTitle = computed(() => (this.isEdit() ? 'Editar Venta' : 'Nueva Venta'));
  readonly buttonLabel = computed(() => (this.isEdit() ? 'Modificar' : 'Crear orden'));

  items = signal<SaleItem[]>([]);
  selectedCustomerId = '';
  deliveryDateInput = '';
  isPaid = false;
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
  readonly canSubmit = computed(
    () => this.items().length > 0 && (this.isEdit() || Boolean(this.selectedCustomerId)),
  );

  constructor() {
    effect(() => {
      const sale = this.existingSale();
      if (sale) {
        this.items.set(sale.items);
        this.selectedCustomerId = sale.customerId ?? '';
        this.deliveryDateInput = sale.deliveryDate ? this.formatDateForInput(sale.deliveryDate.toDate()) : '';
        this.isPaid = sale.isPaid ?? false;
        this.paymentMethod = sale.paymentMethod;
        this.notes = sale.notes;
      }
    });
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toTimestampFromDateInput(dateInput: string): Timestamp | null {
    if (!dateInput) return null;
    return Timestamp.fromDate(new Date(`${dateInput}T12:00:00`));
  }

  private getSelectedCustomer(): Customer | null {
    return this.customers().find((customer) => customer.id === this.selectedCustomerId) ?? null;
  }

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
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
    if (!this.canSubmit()) return;

    const existingSale = this.existingSale();
    const selectedCustomer = this.getSelectedCustomer();
    if (!existingSale && !selectedCustomer) return;

    const sale: SaleInput = {
      date: existingSale?.date ?? Timestamp.now(),
      deliveryDate: this.toTimestampFromDateInput(this.deliveryDateInput),
      customerId: existingSale?.customerId ?? selectedCustomer?.id ?? null,
      customerName: existingSale?.customerName ?? selectedCustomer?.name ?? '',
      items: this.items(),
      total: this.total(),
      totalCost: this.totalCost(),
      profit: this.profit(),
      isPaid: existingSale?.isPaid ?? this.isPaid,
      paymentMethod: existingSale?.paymentMethod ?? this.paymentMethod,
      status: existingSale?.status ?? 'pending',
      notes: this.notes,
    };

    this.dialogRef.close(sale);
  }
}
