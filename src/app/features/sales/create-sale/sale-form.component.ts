import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, HostListener, ElementRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecipesStore } from '../../../core/store/recipes.store';
import { CustomersStore } from '../../../core/store/customers.store';
import { SalesStore } from '../../../core/store/sales.store';
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
  private static readonly DELETED_CUSTOMER_NAME = '[eliminado]';

  private dialogRef = inject(DIALOG_REF) as DialogRef<SaleInput>;
  private dialogData = inject(DIALOG_DATA) as Sale | null;
  readonly recipesStore = inject(RecipesStore);
  readonly salesStore = inject(SalesStore);
  private customersStore = inject(CustomersStore);

  private readonly existingSale = signal<Sale | null>(this.dialogData);
  readonly isEdit = computed(() => this.existingSale() !== null);
  readonly pageTitle = computed(() => (this.isEdit() ? 'Editar Venta' : 'Nueva Venta'));
  readonly buttonLabel = computed(() => (this.isEdit() ? 'Modificar' : 'Crear orden'));

  items = signal<SaleItem[]>([]);
  selectedCustomerId = signal('');
  deliveryDateInput = '';
  isPaid = false;
  paymentMethod: PaymentMethod = 'cash';
  notes = '';

  /** Search text for the customer filter input */
  customerSearch = signal('');

  /** Search text for the product search input */
  readonly productSearch = signal('');

  /** Whether the product search dropdown is visible */
  readonly isProductDropdownOpen = signal(false);

  /** Whether the top 3 products section is collapsed */
  isTop3Collapsed = signal(false);

  /** Whether the customer dropdown is visible */
  isDropdownOpen = signal(false);

  /** Reference to the search input element for focus management */
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('customerSearchInput');

  paymentMethods = Object.entries(PAYMENT_METHOD_DISPLAY).map(([key, label]) => ({
    key: key as PaymentMethod,
    label,
  }));

  /** All customers from the store, excluding deleted ones */
  customers = computed(() =>
    this.customersStore
      .customers()
      .filter((customer) => customer.name !== SaleFormComponent.DELETED_CUSTOMER_NAME),
  );

  /** Customers filtered by the current search text — reactive, no cache */
  filteredCustomers = computed(() => {
    const search = this.customerSearch().toLowerCase().trim();
    if (!search) return this.customers();
    return this.customers().filter(
      (c) =>
        c.name.toLowerCase().includes(search) || c.phone.toLowerCase().includes(search),
    );
  });

  selectedCustomer = computed(() => {
    const id = this.selectedCustomerId();
    if (!id) return null;
    return this.customers().find((customer) => customer.id === id) ?? null;
  });

  total = computed(() => this.items().reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
  totalCost = computed(() => this.items().reduce((sum, i) => sum + i.quantity * i.unitCost, 0));
  profit = computed(() => this.total() - this.totalCost());

  /** Set of recipeIds that the selected customer has purchased in previous sales */
  readonly customerRecipeHistory = computed(() => {
    const customerId = this.selectedCustomerId();
    if (!customerId) return new Set<string>();

    const recipeIds = new Set<string>();
    for (const sale of this.salesStore.sales()) {
      if (sale.customerId !== customerId) continue;
      for (const item of sale.items) {
        recipeIds.add(item.recipeId);
      }
    }
    return recipeIds;
  });

  /** Top 3 most-sold products aggregated from all sales, filtered to active recipes only */
  readonly top3Recipes = computed(() => {
    const allRecipes = this.recipesStore.recipes();
    const allSales = this.salesStore.sales();

    const quantityMap = new Map<string, number>();
    for (const sale of allSales) {
      for (const item of sale.items) {
        quantityMap.set(item.recipeId, (quantityMap.get(item.recipeId) ?? 0) + item.quantity);
      }
    }

    const topBySales = [...quantityMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    return topBySales
      .map((id) => allRecipes.find((r) => r.id === id))
      .filter((r): r is Recipe => r !== undefined)
      .slice(0, 3);
  });

  /** Recipes filtered by productSearch name, case-insensitive, max 3.
   *  Previously purchased by the selected customer appear first, then alphabetical. */
  readonly filteredRecipes = computed(() => {
    const search = this.productSearch().toLowerCase().trim();
    if (!search) return [];

    const history = this.customerRecipeHistory();

    return this.recipesStore
      .recipes()
      .filter((recipe) => recipe.name.toLowerCase().includes(search))
      .sort((a, b) => {
        const aPurchased = history.has(a.id!);
        const bPurchased = history.has(b.id!);
        if (aPurchased !== bPurchased) {
          return aPurchased ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, 3);
  });

  /** Recipes added via search that have quantity > 0, excluding top 3 recipes */
  readonly searchAddedRecipes = computed(() => {
    const top3Ids = new Set(this.top3Recipes().map((r) => r.id));
    const currentItems = this.items();

    return this.recipesStore.recipes().filter((recipe) => {
      if (top3Ids.has(recipe.id)) return false;
      return this.getItemQuantity(recipe.id!) > 0;
    });
  });

  /** Whether any top 3 product has quantity > 0 (for collapse indicator) */
  readonly hasTop3Selection = computed(() =>
    this.top3Recipes().some((recipe) => this.getItemQuantity(recipe.id!) > 0),
  );

  readonly canSubmit = computed(
    () => this.items().length > 0 && (this.isEdit() || Boolean(this.selectedCustomerId())),
  );

  constructor() {
    effect(() => {
      const sale = this.existingSale();
      if (sale) {
        this.items.set(sale.items);
        this.selectedCustomerId.set(sale.customerId ?? '');
        this.deliveryDateInput = sale.deliveryDate ? this.formatDateForInput(sale.deliveryDate.toDate()) : '';
        this.isPaid = sale.isPaid ?? false;
        this.paymentMethod = sale.paymentMethod;
        this.notes = sale.notes;
      }
    });
  }

  /** Close dropdowns when clicking outside the component */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.customer-search-wrapper')) {
      this.isDropdownOpen.set(false);
    }
    if (!target.closest('.product-search-wrapper')) {
      this.isProductDropdownOpen.set(false);
    }
  }

  /** Handle search input changes — updates search signal and opens dropdown */
  onSearchChange(value: string): void {
    this.customerSearch.set(value);
    this.isDropdownOpen.set(true);
  }

  /** Open dropdown on focus */
  onSearchFocus(): void {
    this.isDropdownOpen.set(true);
  }

  /** Select a customer and close the dropdown */
  selectCustomer(customer: Customer): void {
    this.selectedCustomerId.set(customer.id);
    this.customerSearch.set('');
    this.isDropdownOpen.set(false);
  }

  /** Handle product search input changes — updates search signal and opens dropdown */
  onProductSearchChange(value: string): void {
    this.productSearch.set(value);
    this.isProductDropdownOpen.set(value.trim().length > 0);
  }

  /** Open product search dropdown on focus */
  onProductSearchFocus(): void {
    this.isProductDropdownOpen.set(true);
  }

  /** Select a product from search results — adds to items, clears search, closes dropdown */
  onProductSearchSelect(recipe: Recipe): void {
    this.addItem(recipe);
    this.productSearch.set('');
    this.isProductDropdownOpen.set(false);
  }

  /** Clear the selected customer and focus the search input */
  clearCustomer(): void {
    this.selectedCustomerId.set('');
    this.searchInput()?.nativeElement.focus();
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
    return this.selectedCustomer();
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
      isPaid: this.isPaid,
      paymentMethod: this.paymentMethod,
      status: existingSale?.status ?? 'pending',
      notes: this.notes,
    };

    this.dialogRef.close(sale);
  }
}
