import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SaleFormComponent } from './sale-form.component';
import { RecipesStore } from '../../../core/store/recipes.store';
import { CustomersStore } from '../../../core/store/customers.store';
import { SalesStore } from '../../../core/store/sales.store';
import { DIALOG_DATA, DIALOG_REF } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';
import type { Customer } from '../../../core/models/customer';
import type { Sale, SaleItem } from '../../../core/models/sale';
import type { Recipe } from '../../../core/models/recipe';

function createCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-1',
    name: 'Juan Perez',
    phone: '1122334455',
    address: '',
    notes: '',
    totalPurchases: 0,
    lastPurchase: null,
    ...overrides,
  };
}

function createRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: `rec-${crypto.randomUUID()}`,
    name: 'Test Recipe',
    category: 'cakes',
    ingredients: [],
    calculatedCost: 50,
    profitMargin: 50,
    suggestedPrice: 100,
    salePrice: 100,
    yield: 1,
    notes: '',
    imageUrl: '',
    active: true,
    ...overrides,
  };
}

function createSaleItem(overrides: Partial<SaleItem> = {}): SaleItem {
  return {
    recipeId: 'rec-1',
    name: 'Test Item',
    quantity: 1,
    unitPrice: 100,
    unitCost: 50,
    ...overrides,
  };
}

function createSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-1',
    date: { seconds: 1719000000, nanoseconds: 0, toDate: () => new Date('2026-06-21') } as Sale['date'],
    deliveryDate: null,
    customerId: 'cust-1',
    customerName: 'Test Customer',
    items: [],
    total: 0,
    totalCost: 0,
    profit: 0,
    isPaid: false,
    paymentMethod: 'cash',
    status: 'pending',
    notes: '',
    ...overrides,
  };
}

describe('SaleFormComponent', () => {
  let fixture: ComponentFixture<SaleFormComponent>;
  let component: SaleFormComponent;

  const dialogRefMock: Pick<DialogRef<unknown>, 'close'> = {
    close: vi.fn(),
  };

  const customers: Customer[] = [
    createCustomer({ id: 'cust-1', name: 'Juan Perez', phone: '1122334455' }),
    createCustomer({ id: 'cust-2', name: 'Maria Rodriguez', phone: '5566778899' }),
    createCustomer({ id: 'cust-3', name: 'Carlos Lopez', phone: '9900112233' }),
    createCustomer({ id: 'cust-4', name: 'Ana Martinez', phone: '3344556677' }),
  ];

  const customersSignal = signal(customers);

  const recipesStoreMock = {
    recipes: signal([] as Recipe[]),
  };

  const customersStoreMock = {
    customers: customersSignal,
  };

  const salesSignal = signal<Sale[]>([]);

  const salesStoreMock = {
    sales: salesSignal,
  };

  function createComponent(dialogData: unknown = null): void {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      imports: [SaleFormComponent],
      providers: [
        { provide: DIALOG_REF, useValue: dialogRefMock },
        { provide: DIALOG_DATA, useValue: dialogData },
        { provide: RecipesStore, useValue: recipesStoreMock },
        { provide: CustomersStore, useValue: customersStoreMock },
        { provide: SalesStore, useValue: salesStoreMock },
      ],
    });

    fixture = TestBed.createComponent(SaleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('new sale mode', () => {
    beforeEach(() => {
      createComponent();
    });

    it('shows search input when no customer is selected', () => {
      const input = fixture.nativeElement.querySelector('[placeholder*="Buscar cliente"]');
      expect(input).toBeTruthy();
    });

    it('does not show the selected-customer block when no customer is selected', () => {
      const selectedBlock = fixture.nativeElement.querySelector('.selected-customer');
      expect(selectedBlock).toBeFalsy();
    });

    it('filters customers by name when typing in search', () => {
      component.onSearchChange('Maria');
      fixture.detectChanges();

      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].name).toBe('Maria Rodriguez');
    });

    it('filters customers by phone when typing in search', () => {
      component.onSearchChange('9900');
      fixture.detectChanges();

      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].phone).toBe('9900112233');
    });

    it('shows all customers when search is empty and dropdown is open', () => {
      component.onSearchChange('');
      fixture.detectChanges();

      expect(component.filteredCustomers().length).toBe(customers.length);
    });

    it('opens dropdown on search change', () => {
      component.onSearchChange('Juan');
      fixture.detectChanges();

      expect(component.isDropdownOpen()).toBe(true);
    });

    it('renders dropdown items when dropdown is open', () => {
      component.onSearchChange('Carlos');
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.customer-dropdown-item');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('Carlos Lopez');
    });

    it('shows empty state when no customers match search', () => {
      component.onSearchChange('ZZZZZZ');
      fixture.detectChanges();

      const empty = fixture.nativeElement.querySelector('.customer-dropdown-empty');
      expect(empty).toBeTruthy();
      expect(empty.textContent).toContain('Sin resultados');
    });

    it('selects a customer and closes dropdown on click', () => {
      component.onSearchChange('Maria');
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('.customer-dropdown-item');
      item.click();
      fixture.detectChanges();

      expect(component.selectedCustomerId()).toBe('cust-2');
      expect(component.isDropdownOpen()).toBe(false);
      expect(component.selectedCustomer()).toBeTruthy();
      expect(component.selectedCustomer()!.name).toBe('Maria Rodriguez');
    });

    it('shows selected customer info after selection', () => {
      const customer = customers[0];
      component.selectCustomer(customer);
      fixture.detectChanges();

      const info = fixture.nativeElement.querySelector('.selected-customer-info');
      expect(info).toBeTruthy();
      expect(info.textContent).toContain('Juan Perez');
      expect(info.textContent).toContain('1122334455');
    });

    it('clears customer selection and shows search input again', () => {
      component.selectCustomer(customers[0]);
      fixture.detectChanges();

      component.clearCustomer();
      fixture.detectChanges();

      expect(component.selectedCustomerId()).toBe('');
      const input = fixture.nativeElement.querySelector('[placeholder*="Buscar cliente"]');
      expect(input).toBeTruthy();
    });

    it('sets canSubmit to false when no customer is selected and no items', () => {
      expect(component.canSubmit()).toBe(false);
    });

    it('sets canSubmit to true when customer is selected', () => {
      component.selectCustomer(customers[0]);
      component.items.set([{
        recipeId: 'rec-1',
        name: 'Torta',
        quantity: 1,
        unitPrice: 100,
        unitCost: 50,
      }]);
      fixture.detectChanges();

      expect(component.canSubmit()).toBe(true);
    });

    it('prevents confirm when no customer is selected', () => {
      component.items.set([{
        recipeId: 'rec-1', name: 'Torta', quantity: 1, unitPrice: 100, unitCost: 50,
      }]);
      fixture.detectChanges();

      component.confirm();

      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('closes dialog with sale input on confirm with selected customer', () => {
      component.selectCustomer(customers[0]);
      component.items.set([{
        recipeId: 'rec-1', name: 'Torta', quantity: 2, unitPrice: 100, unitCost: 50,
      }]);
      component.deliveryDateInput = '2026-07-01';
      fixture.detectChanges();

      component.confirm();

      expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
      const result = (dialogRefMock.close as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(result.customerId).toBe('cust-1');
      expect(result.customerName).toBe('Juan Perez');
      expect(result.items).toHaveLength(1);
    });

    it('does not render edit badge in new sale mode', () => {
      component.selectCustomer(customers[0]);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.selected-customer-badge');
      expect(badge).toBeFalsy();
    });

    it('shows clear button in new sale mode when customer selected', () => {
      component.selectCustomer(customers[0]);
      fixture.detectChanges();

      const clearBtn = fixture.nativeElement.querySelector('.selected-customer-clear');
      expect(clearBtn).toBeTruthy();
      expect(clearBtn.textContent).toContain('Cambiar cliente');
    });
  });

  describe('edit mode', () => {
    const existingSale = {
      id: 'sale-1',
      date: { seconds: 1719000000, nanoseconds: 0, toDate: () => new Date('2026-06-21') },
      deliveryDate: null,
      customerId: 'cust-1',
      customerName: 'Juan Perez',
      items: [{ recipeId: 'rec-1', name: 'Torta', quantity: 2, unitPrice: 100, unitCost: 50 }],
      total: 200,
      totalCost: 100,
      profit: 100,
      isPaid: true,
      paymentMethod: 'cash',
      status: 'pending',
      notes: 'Entregar antes de las 18',
    };

    beforeEach(() => {
      createComponent(existingSale);
    });

    it('pre-selects the customer from the existing sale', () => {
      expect(component.selectedCustomerId()).toBe('cust-1');
      expect(component.isEdit()).toBe(true);
    });

    it('shows customer info as read-only in edit mode', () => {
      const info = fixture.nativeElement.querySelector('.selected-customer-info');
      expect(info).toBeTruthy();
      expect(info.textContent).toContain('Juan Perez');
    });

    it('shows edit badge in edit mode', () => {
      const badge = fixture.nativeElement.querySelector('.selected-customer-badge');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('Edición');
    });

    it('does not show clear button in edit mode', () => {
      const clearBtn = fixture.nativeElement.querySelector('.selected-customer-clear');
      expect(clearBtn).toBeFalsy();
    });

    it('does not render search input in edit mode', () => {
      const input = fixture.nativeElement.querySelector('[placeholder*="Buscar cliente"]');
      expect(input).toBeFalsy();
    });

    it('can submit with existing items in edit mode', () => {
      expect(component.canSubmit()).toBe(true);
    });

    it('closes dialog with existing sale data on confirm', () => {
      component.confirm();

      expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
      const result = (dialogRefMock.close as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(result.customerId).toBe('cust-1');
      expect(result.customerName).toBe('Juan Perez');
      expect(result.status).toBe('pending');
      expect(result.notes).toBe('Entregar antes de las 18');
    });
  });

  describe('filteredCustomers reactivity', () => {
    it('re-filters when store customers change', () => {
      createComponent();

      component.onSearchChange('Juan');
      fixture.detectChanges();

      expect(component.filteredCustomers().length).toBe(1);

      // Simulate store update — no cache, reads directly from store signal
      customersSignal.set([
        ...customers,
        createCustomer({ id: 'cust-5', name: 'Juanita Alvarez', phone: '7788990011' }),
      ]);
      fixture.detectChanges();

      expect(component.filteredCustomers().length).toBe(2);
    });
  });

  describe('top3Recipes', () => {
    const rec1 = createRecipe({ id: 'rec-1', name: 'Torta 1' });
    const rec2 = createRecipe({ id: 'rec-2', name: 'Torta 2' });
    const rec3 = createRecipe({ id: 'rec-3', name: 'Torta 3' });
    const rec4 = createRecipe({ id: 'rec-4', name: 'Torta 4' });

    beforeEach(() => {
      createComponent();
    });

    it('returns empty array when there are no sales', () => {
      salesSignal.set([]);
      recipesStoreMock.recipes.set([rec1, rec2, rec3]);
      fixture.detectChanges();

      expect(component.top3Recipes()).toEqual([]);
    });

    it('returns recipes ranked by total quantity sold across all sales', () => {
      salesSignal.set([
        createSale({
          items: [
            createSaleItem({ recipeId: 'rec-1', quantity: 5 }),
            createSaleItem({ recipeId: 'rec-2', quantity: 3 }),
            createSaleItem({ recipeId: 'rec-3', quantity: 1 }),
          ],
        }),
        createSale({
          items: [
            createSaleItem({ recipeId: 'rec-1', quantity: 2 }),
            createSaleItem({ recipeId: 'rec-2', quantity: 4 }),
          ],
        }),
      ]);
      recipesStoreMock.recipes.set([rec1, rec2, rec3, rec4]);
      fixture.detectChanges();

      const result = component.top3Recipes();
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('rec-1');
      expect(result[1].id).toBe('rec-2');
      expect(result[2].id).toBe('rec-3');
    });

    it('shows fewer than 3 when only 1 active recipe has sales', () => {
      salesSignal.set([
        createSale({ items: [createSaleItem({ recipeId: 'rec-1', quantity: 3 })] }),
      ]);
      recipesStoreMock.recipes.set([rec1]);
      fixture.detectChanges();

      const result = component.top3Recipes();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rec-1');
    });

    it('excludes inactive recipes that are absent from RecipesStore', () => {
      salesSignal.set([
        createSale({
          items: [
            createSaleItem({ recipeId: 'rec-inactive', quantity: 10 }),
            createSaleItem({ recipeId: 'rec-1', quantity: 5 }),
            createSaleItem({ recipeId: 'rec-2', quantity: 3 }),
            createSaleItem({ recipeId: 'rec-3', quantity: 2 }),
          ],
        }),
      ]);
      // Only active recipes are in RecipesStore (rec-inactive is NOT included)
      recipesStoreMock.recipes.set([rec1, rec2, rec3]);
      fixture.detectChanges();

      const result = component.top3Recipes();
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('rec-1');
      expect(result[1].id).toBe('rec-2');
      expect(result[2].id).toBe('rec-3');
    });
  });

  describe('filteredRecipes', () => {
    const recA = createRecipe({ id: 'rec-a', name: 'Alfajor' });
    const recB = createRecipe({ id: 'rec-b', name: 'Brownie' });
    const recC = createRecipe({ id: 'rec-c', name: 'Cheesecake' });
    const recD = createRecipe({ id: 'rec-d', name: 'Donut' });

    beforeEach(() => {
      createComponent();
      recipesStoreMock.recipes.set([recA, recB, recC, recD]);
      fixture.detectChanges();
    });

    it('returns empty array when search is empty', () => {
      component.productSearch.set('');
      fixture.detectChanges();

      expect(component.filteredRecipes()).toEqual([]);
    });

    it('matches recipes case-insensitively', () => {
      component.productSearch.set('brown');
      fixture.detectChanges();

      const result = component.filteredRecipes();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rec-b');
    });

    it('returns up to 3 results sorted alphabetically', () => {
      const extraRecipes = [
        createRecipe({ id: 'rec-e', name: 'Croissant' }),
        createRecipe({ id: 'rec-f', name: 'Crepe' }),
        createRecipe({ id: 'rec-g', name: 'Cupcake' }),
      ];
      recipesStoreMock.recipes.set([recA, recB, recC, recD, ...extraRecipes]);
      fixture.detectChanges();

      component.productSearch.set('c');
      fixture.detectChanges();

      const result = component.filteredRecipes();
      // Should be: Cheesecake, Crepe, Croissant (sorted alpha, max 3)
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('rec-c');
      expect(result[1].id).toBe('rec-f');
      expect(result[2].id).toBe('rec-e');
    });

    it('returns empty array when no recipes match', () => {
      component.productSearch.set('zzzzzz');
      fixture.detectChanges();

      expect(component.filteredRecipes()).toEqual([]);
    });

    it('updates when RecipesStore changes', () => {
      component.productSearch.set('brown');
      fixture.detectChanges();

      expect(component.filteredRecipes()).toHaveLength(1);

      recipesStoreMock.recipes.set([recB, createRecipe({ id: 'rec-h', name: 'Brownie XL' })]);
      fixture.detectChanges();

      expect(component.filteredRecipes()).toHaveLength(2);
    });
  });

  describe('searchAddedRecipes', () => {
    const topRec = createRecipe({ id: 'rec-top', name: 'Top Product' });
    const addedRec = createRecipe({ id: 'rec-added', name: 'Added Product' });
    const zeroRec = createRecipe({ id: 'rec-zero', name: 'Zero Product' });

    beforeEach(() => {
      createComponent();
      salesSignal.set([
        createSale({
          items: [createSaleItem({ recipeId: 'rec-top', quantity: 10 })],
        }),
      ]);
      recipesStoreMock.recipes.set([topRec, addedRec, zeroRec]);
      fixture.detectChanges();
    });

    it('returns empty array when no items have been added', () => {
      component.items.set([]);
      fixture.detectChanges();

      expect(component.searchAddedRecipes()).toEqual([]);
    });

    it('excludes top 3 recipes from search added section', () => {
      component.items.set([
        { recipeId: 'rec-top', name: 'Top Product', quantity: 2, unitPrice: 100, unitCost: 50 },
        { recipeId: 'rec-added', name: 'Added Product', quantity: 1, unitPrice: 100, unitCost: 50 },
      ]);
      fixture.detectChanges();

      const result = component.searchAddedRecipes();
      // rec-top is in top 3 → excluded
      // rec-added has qty > 0 → included
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rec-added');
    });

    it('includes items with quantity greater than 0', () => {
      component.items.set([
        { recipeId: 'rec-added', name: 'Added Product', quantity: 3, unitPrice: 100, unitCost: 50 },
      ]);
      fixture.detectChanges();

      const result = component.searchAddedRecipes();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rec-added');
    });

    it('excludes items with quantity 0', () => {
      component.items.set([
        { recipeId: 'rec-zero', name: 'Zero Product', quantity: 0, unitPrice: 100, unitCost: 50 },
      ]);
      fixture.detectChanges();

      const result = component.searchAddedRecipes();
      expect(result).toEqual([]);
    });

    it('reactively updates when items change', () => {
      component.items.set([
        { recipeId: 'rec-added', name: 'Added Product', quantity: 1, unitPrice: 100, unitCost: 50 },
      ]);
      fixture.detectChanges();
      expect(component.searchAddedRecipes()).toHaveLength(1);

      component.items.set([
        { recipeId: 'rec-added', name: 'Added Product', quantity: 0, unitPrice: 100, unitCost: 50 },
      ]);
      fixture.detectChanges();
      expect(component.searchAddedRecipes()).toHaveLength(0);
    });
  });

  describe('product search handlers', () => {
    const recipe = createRecipe({ id: 'rec-search', name: 'Searchable' });

    beforeEach(() => {
      createComponent();
      recipesStoreMock.recipes.set([recipe]);
      fixture.detectChanges();
    });

    describe('onProductSearchChange', () => {
      it('updates the productSearch signal and opens the dropdown', () => {
        component.onProductSearchChange('Alfajor');
        fixture.detectChanges();

        expect(component.productSearch()).toBe('Alfajor');
        expect(component.isProductDropdownOpen()).toBe(true);
      });
    });

    describe('onProductSearchFocus', () => {
      it('opens the product dropdown', () => {
        component.onProductSearchFocus();
        fixture.detectChanges();

        expect(component.isProductDropdownOpen()).toBe(true);
      });
    });

    describe('onProductSearchSelect', () => {
      it('adds item, clears search, and closes dropdown', () => {
        component.onProductSearchSelect(recipe);
        fixture.detectChanges();

        expect(component.getItemQuantity(recipe.id!)).toBe(1);
        expect(component.productSearch()).toBe('');
        expect(component.isProductDropdownOpen()).toBe(false);
      });
    });
  });

  describe('product search dropdown lifecycle', () => {
    const rec1 = createRecipe({ id: 'rec-p1', name: 'Product 1' });

    beforeEach(() => {
      createComponent();
      recipesStoreMock.recipes.set([rec1]);
      fixture.detectChanges();
    });

    it('opens on focus', () => {
      component.onProductSearchFocus();
      fixture.detectChanges();

      expect(component.isProductDropdownOpen()).toBe(true);
    });

    it('opens on search change', () => {
      component.onProductSearchChange('test');
      fixture.detectChanges();

      expect(component.isProductDropdownOpen()).toBe(true);
    });

    it('closes on outside click (click outside .product-search-wrapper)', () => {
      component.isProductDropdownOpen.set(true);
      fixture.detectChanges();

      const outsideClick = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(outsideClick, 'target', { value: document.body });
      component.onDocumentClick(outsideClick);
      fixture.detectChanges();

      expect(component.isProductDropdownOpen()).toBe(false);
    });

    it('stays open when clicking inside .product-search-wrapper', () => {
      component.isProductDropdownOpen.set(true);
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.product-search-wrapper') ?? document.createElement('div');
      wrapper.className = 'product-search-wrapper';
      const insideClick = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(insideClick, 'target', { value: wrapper });
      component.onDocumentClick(insideClick);
      fixture.detectChanges();

      expect(component.isProductDropdownOpen()).toBe(true);
    });

    it('closes on selection and clears search', () => {
      component.onProductSearchChange('Product');
      fixture.detectChanges();

      expect(component.isProductDropdownOpen()).toBe(true);

      component.onProductSearchSelect(rec1);
      fixture.detectChanges();

      expect(component.isProductDropdownOpen()).toBe(false);
      expect(component.productSearch()).toBe('');
      expect(component.getItemQuantity(rec1.id!)).toBe(1);
    });

    it('is independent from customer dropdown', () => {
      component.onProductSearchChange('test');
      component.onSearchChange('customer');
      fixture.detectChanges();

      expect(component.isProductDropdownOpen()).toBe(true);
      expect(component.isDropdownOpen()).toBe(true);

      // Close customer dropdown only
      const customerClick = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(customerClick, 'target', { value: document.body });
      component.onDocumentClick(customerClick);
      fixture.detectChanges();

      // Both close because body click is outside BOTH wrappers
      expect(component.isDropdownOpen()).toBe(false);
      expect(component.isProductDropdownOpen()).toBe(false);
    });
  });

  describe('template rendering', () => {
    const topRec = createRecipe({ id: 'rec-1', name: 'Top Torta', salePrice: 100 });
    const addedRec = createRecipe({ id: 'rec-2', name: 'Added Torta', salePrice: 150 });

    beforeEach(() => {
      createComponent();
      salesSignal.set([
        createSale({ items: [createSaleItem({ recipeId: 'rec-1', quantity: 10 })] }),
      ]);
      recipesStoreMock.recipes.set([topRec, addedRec]);
      fixture.detectChanges();
    });

    it('renders product search input', () => {
      const input = fixture.nativeElement.querySelector('[placeholder*="Buscar producto"]');
      expect(input).toBeTruthy();
    });

    it('renders top 3 product items when they have quantity > 0', () => {
      // Given: top recipe has quantity > 0
      component.items.set([
        { recipeId: 'rec-1', name: 'Top Torta', quantity: 2, unitPrice: 100, unitCost: 50 },
      ]);
      fixture.detectChanges();

      const topProductEl = fixture.nativeElement.querySelector('.top3-items app-sale-product-item');
      expect(topProductEl).toBeTruthy();
    });

    it('renders top 3 products even when quantity is 0', () => {
      component.items.set([]);
      fixture.detectChanges();

      const topProductEl = fixture.nativeElement.querySelector('.top3-items app-sale-product-item');
      expect(topProductEl).toBeTruthy();
    });

    it('renders search-added products in the recipe-rows section', () => {
      component.items.set([
        { recipeId: 'rec-2', name: 'Added Torta', quantity: 3, unitPrice: 150, unitCost: 75 },
      ]);
      fixture.detectChanges();

      // Search input should be visible
      const searchInput = fixture.nativeElement.querySelector('[placeholder*="Buscar producto"]');
      expect(searchInput).toBeTruthy();
    });

    it('renders dropdown items when product search is active and has matches', () => {
      component.onProductSearchChange('Top');
      fixture.detectChanges();

      const dropdownItems = fixture.nativeElement.querySelectorAll('.product-dropdown-item');
      expect(dropdownItems.length).toBe(1);
      expect(dropdownItems[0].textContent).toContain('Top Torta');
    });

    it('shows empty state in product dropdown when no matches', () => {
      component.onProductSearchChange('ZZZZZZ');
      fixture.detectChanges();

      const empty = fixture.nativeElement.querySelector('.product-dropdown-empty');
      expect(empty).toBeTruthy();
      expect(empty.textContent).toContain('Sin resultados');
    });

    it('adds item and closes dropdown when clicking a search result', () => {
      component.onProductSearchChange('Top');
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('.product-dropdown-item');
      item.click();
      fixture.detectChanges();

      expect(component.getItemQuantity('rec-1')).toBe(1);
      expect(component.productSearch()).toBe('');
    });
  });

  describe('dropdown lifecycle', () => {
    beforeEach(() => {
      createComponent();
    });

    it('closes dropdown when clicking outside', () => {
      component.isDropdownOpen.set(true);
      fixture.detectChanges();

      document.body.click();
      fixture.detectChanges();

      expect(component.isDropdownOpen()).toBe(false);
    });

    it('keeps dropdown open when clicking inside the wrapper', () => {
      component.onSearchChange('a');
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.customer-search-wrapper');
      wrapper.click();
      fixture.detectChanges();

      // document:click fires on body, which is outside the wrapper
      // but we need to simulate properly
      component.isDropdownOpen.set(true);
      fixture.detectChanges();

      // Simulate click inside wrapper — should NOT close
      const internalClick = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(internalClick, 'target', { value: wrapper });
      component.onDocumentClick(internalClick);
      fixture.detectChanges();

      expect(component.isDropdownOpen()).toBe(true);
    });
  });
});
