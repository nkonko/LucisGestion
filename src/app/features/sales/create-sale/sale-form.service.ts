import { signal, computed, effect, inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { Sale, SaleItem, PaymentMethod, PAYMENT_METHOD_DISPLAY } from '../../../core/models/sale';
import { Timestamp } from '@angular/fire/firestore';
import { Customer } from '../../../core/models/customer';
import { Recipe } from '../../../core/models/recipe';
import { DIALOG_DATA } from '../../../core/models/dialog/dialog-tokens.model';
import { RecipesStore } from '../../../core/store/recipes.store';
import { SalesStore } from '../../../core/store/sales.store';
import { CustomersStore } from '../../../core/store/customers.store';

@Injectable()
export class SaleFormService {
  private static readonly DELETED_CUSTOMER_NAME = '[eliminado]';

  private readonly recipesStore = inject(RecipesStore);
  private readonly salesStore = inject(SalesStore);
  private readonly customersStore = inject(CustomersStore);

  readonly existingSale: Signal<Sale | null> = signal(inject(DIALOG_DATA) as Sale | null);

  // State signals
  items: WritableSignal<SaleItem[]> = signal<SaleItem[]>([]);
  selectedCustomerId: WritableSignal<string> = signal('');
  deliveryDateInput = '';
  isPaid = false;
  paymentMethod: PaymentMethod = 'cash';
  notes = '';
  customerSearch: WritableSignal<string> = signal('');
  productSearch: WritableSignal<string> = signal('');
  isProductDropdownOpen: WritableSignal<boolean> = signal(false);
  isTop3Collapsed: WritableSignal<boolean> = signal(false);
  isDropdownOpen: WritableSignal<boolean> = signal(false);

  // Computed signals
  readonly isEdit = computed(() => this.existingSale() !== null);
  readonly pageTitle = computed(() => (this.isEdit() ? 'Editar Venta' : 'Nueva Venta'));
  readonly buttonLabel = computed(() => (this.isEdit() ? 'Modificar' : 'Crear orden'));

  readonly paymentMethods = Object.entries(PAYMENT_METHOD_DISPLAY).map(([key, label]) => ({
    key: key as PaymentMethod,
    label,
  }));

  readonly customers = computed(() =>
    this.customersStore
      .customers()
      .filter((customer) => customer.name !== SaleFormService.DELETED_CUSTOMER_NAME),
  );

  readonly filteredCustomers = computed(() => {
    const search = this.customerSearch().toLowerCase().trim();
    if (!search) return this.customers();
    return this.customers().filter(
      (c) =>
        c.name.toLowerCase().includes(search) || c.phone.toLowerCase().includes(search),
    );
  });

  readonly selectedCustomer = computed(() => {
    const id = this.selectedCustomerId();
    if (!id) return null;
    return this.customers().find((customer) => customer.id === id) ?? null;
  });

  readonly total = computed(() => this.items().reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
  readonly totalCost = computed(() => this.items().reduce((sum, i) => sum + i.quantity * i.unitCost, 0));
  readonly profit = computed(() => this.total() - this.totalCost());

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

  readonly searchAddedRecipes = computed(() => {
    const top3Ids = new Set(this.top3Recipes().map((r) => r.id));
    const currentItems = this.items();
    return this.recipesStore.recipes().filter((recipe) => {
      if (top3Ids.has(recipe.id)) return false;
      return this.getItemQuantity(recipe.id!) > 0;
    });
  });

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

  onSearchChange(value: string): void {
    this.customerSearch.set(value);
    this.isDropdownOpen.set(true);
  }

  onSearchFocus(): void {
    this.isDropdownOpen.set(true);
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomerId.set(customer.id);
    this.customerSearch.set('');
    this.isDropdownOpen.set(false);
  }

  clearCustomer(): void {
    this.selectedCustomerId.set('');
  }

  onProductSearchChange(value: string): void {
    this.productSearch.set(value);
    this.isProductDropdownOpen.set(value.trim().length > 0);
  }

  onProductSearchFocus(): void {
    this.isProductDropdownOpen.set(true);
  }

  onProductSearchSelect(recipe: Recipe): void {
    this.addItem(recipe);
    this.productSearch.set('');
    this.isProductDropdownOpen.set(false);
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

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toTimestampFromDateInput(dateInput: string): Timestamp | null {
    if (!dateInput) return null;
    return Timestamp.fromDate(new Date(`${dateInput}T12:00:00`));
  }
}
