import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { RecipeWizardComponent } from './recipe-wizard.component';
import { IngredientsStore } from '../../../core/store/ingredients.store';
import { DIALOG_DATA, DIALOG_REF } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';
import type { Ingredient, RecipeIngredient } from '../../../core/models/ingredient';

describe('RecipeWizardComponent', () => {
  let fixture: ComponentFixture<RecipeWizardComponent>;
  let component: RecipeWizardComponent;

  const dialogRefMock: Pick<DialogRef<unknown>, 'close'> = {
    close: vi.fn(),
  };

  const ingredients: Ingredient[] = [
    {
      id: 'ing-1',
      name: 'Chocolate',
      unit: 'kg',
      unitPrice: 10,
      currentStock: 100,
      minimumStock: 1,
      category: 'other',
      lastPurchase: null,
      active: true,
    },
    {
      id: 'ing-2',
      name: 'Choco Chips',
      unit: 'kg',
      unitPrice: 20,
      currentStock: 100,
      minimumStock: 1,
      category: 'other',
      lastPurchase: null,
      active: true,
    },
  ];

  const ingredientsStoreMock = {
    ingredients: signal(ingredients),
  };

  function createComponent(data: unknown = null): void {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      imports: [RecipeWizardComponent],
      providers: [
        { provide: DIALOG_REF, useValue: dialogRefMock },
        { provide: DIALOG_DATA, useValue: data },
        { provide: IngredientsStore, useValue: ingredientsStoreMock },
      ],
    });

    fixture = TestBed.createComponent(RecipeWizardComponent);
    component = fixture.componentInstance;
    // Reset baseline after creation (it's captured during init)
    fixture.detectChanges();
  }

  describe('create mode', () => {
    beforeEach(() => {
      createComponent(null);
    });

    it('renders step 0 content (name input + category form) by default', () => {
      expect(component.currentStep()).toBe(0);
      const nameInput = fixture.debugElement.query(By.css('[data-initial-focus]'));
      expect(nameInput).toBeTruthy();
      expect(nameInput.name).toBe('input');
    });

    it('renders step 1 content (ingredient form) after navigating', () => {
      component.name.set('Test Recipe');
      component.next();
      fixture.detectChanges();

      expect(component.currentStep()).toBe(1);
      const ingredientForm = fixture.debugElement.query(By.css('app-recipe-ingredient-form'));
      expect(ingredientForm).toBeTruthy();
    });

    it('renders step 2 content (cost form) after navigating', () => {
      component.name.set('Test Recipe');
      component.recipeIngredients.set([
        { ingredientId: 'ing-1', name: 'Chocolate', quantity: 1, unit: 'kg', lineCost: 10 },
      ]);
      component.next();
      component.next();
      fixture.detectChanges();

      expect(component.currentStep()).toBe(2);
      const costForm = fixture.debugElement.query(By.css('app-cost-form'));
      expect(costForm).toBeTruthy();
    });

    it('renders step 3 content (notes + imageUrl) after navigating', () => {
      component.name.set('Test Recipe');
      component.recipeIngredients.set([
        { ingredientId: 'ing-1', name: 'Chocolate', quantity: 1, unit: 'kg', lineCost: 10 },
      ]);
      component.next();
      component.next();
      component.next();
      fixture.detectChanges();

      expect(component.currentStep()).toBe(3);
      const textarea = fixture.debugElement.query(By.css('textarea'));
      expect(textarea).toBeTruthy();
      // Step 3 should show notes textarea and imageUrl input
      const inputs = fixture.debugElement.queryAll(By.css('input'));
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    it('navigates prev and next correctly', () => {
      component.name.set('Test');
      component.next();
      expect(component.currentStep()).toBe(1);

      component.prev();
      expect(component.currentStep()).toBe(0);
    });

    it('disables next when step 0 is invalid (empty name)', () => {
      fixture.detectChanges();
      // Next button should be disabled because name is empty
      const nextBtn = fixture.debugElement.query(By.css('.wizard__nav-btn--next'));
      expect(nextBtn).toBeTruthy();
      expect(nextBtn.nativeElement.disabled).toBe(true);
    });

    it('enables next when step 0 is valid (name provided)', () => {
      component.name.set('Test Recipe');
      fixture.detectChanges();
      const nextBtn = fixture.debugElement.query(By.css('.wizard__nav-btn--next'));
      expect(nextBtn).toBeTruthy();
      expect(nextBtn.nativeElement.disabled).toBe(false);
    });

    it('blocks skipping steps via goToStep in create mode', () => {
      // Sin nombre en step 0, no puede saltar al step 2
      component.goToStep(2);
      expect(component.currentStep()).toBe(0);
    });

    it('allows sequential navigation via goToStep when steps are valid', () => {
      component.name.set('Test');
      component.goToStep(1);
      expect(component.currentStep()).toBe(1);

      component.recipeIngredients.set([
        { ingredientId: 'ing-1', name: 'Chocolate', quantity: 1, unit: 'kg', lineCost: 10 },
      ]);
      component.goToStep(2);
      expect(component.currentStep()).toBe(2);

      component.goToStep(3);
      expect(component.currentStep()).toBe(3);
    });

    it('allows going back to any previous step', () => {
      component.name.set('Test');
      component.recipeIngredients.set([
        { ingredientId: 'ing-1', name: 'Chocolate', quantity: 1, unit: 'kg', lineCost: 10 },
      ]);
      component.next();
      component.next();
      expect(component.currentStep()).toBe(2);

      // Puede volver al step 0 directamente
      component.goToStep(0);
      expect(component.currentStep()).toBe(0);
    });

    it('hides prev on step 0', () => {
      fixture.detectChanges();
      const prevBtn = fixture.debugElement.query(By.css('.wizard__nav-btn--prev'));
      expect(prevBtn).toBeNull();
    });

    it('shows submit button only on step 3 with "Crear receta" label', () => {
      component.name.set('Test');
      component.recipeIngredients.set([
        { ingredientId: 'ing-1', name: 'Chocolate', quantity: 1, unit: 'kg', lineCost: 10 },
      ]);
      component.next();
      component.next();
      component.next();
      fixture.detectChanges();

      const submitBtn = fixture.debugElement.query(By.css('.wizard__submit-btn'));
      expect(submitBtn).toBeTruthy();
      expect(submitBtn.nativeElement.textContent.trim()).toBe('Crear receta');

      // Next should be hidden on step 3
      const nextBtn = fixture.debugElement.query(By.css('.wizard__nav-btn--next'));
      expect(nextBtn).toBeNull();
    });

    it('shows validation message and disables submit when image URL extension is invalid', () => {
      component.name.set('Test');
      component.recipeIngredients.set([
        { ingredientId: 'ing-1', name: 'Chocolate', quantity: 1, unit: 'kg', lineCost: 10 },
      ]);
      component.next();
      component.next();
      component.next();
      component.imageUrl.set('https://example.com/file.txt');
      fixture.detectChanges();

      const submitBtn = fixture.debugElement.query(By.css('.wizard__submit-btn'));
      expect(submitBtn).toBeTruthy();
      expect(submitBtn.nativeElement.disabled).toBe(true);

      const errorText = fixture.debugElement.query(By.css('.wizard-field__error'));
      expect(errorText).toBeTruthy();
      expect(errorText.nativeElement.textContent).toContain('extensión válida');
    });

    it('enables submit when image URL extension is valid', () => {
      component.name.set('Test');
      component.recipeIngredients.set([
        { ingredientId: 'ing-1', name: 'Chocolate', quantity: 1, unit: 'kg', lineCost: 10 },
      ]);
      component.next();
      component.next();
      component.next();
      component.imageUrl.set('https://example.com/file.webp');
      fixture.detectChanges();

      const submitBtn = fixture.debugElement.query(By.css('.wizard__submit-btn'));
      expect(submitBtn).toBeTruthy();
      expect(submitBtn.nativeElement.disabled).toBe(false);

      const errorText = fixture.debugElement.query(By.css('.wizard-field__error'));
      expect(errorText).toBeNull();
    });

    it('assembles Recipe data on save', () => {
      component.name.set('Torta de chocolate');
      component.salePrice.set(0);
      component.recipeIngredients.set([
        { ingredientId: 'ing-1', name: 'Chocolate', quantity: 2, unit: 'kg', lineCost: 20 },
      ]);

      const suggested = component.suggestedPrice();
      component.save();

      expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
      expect(dialogRefMock.close).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Torta de chocolate',
          salePrice: suggested,
          suggestedPrice: suggested,
          profitMargin: component.profitMargin(),
          active: true,
        }),
      );
    });

    it('closes with undefined on cancel', () => {
      component.cancel();
      expect(dialogRefMock.close).toHaveBeenCalledWith(undefined);
    });
  });

  describe('edit mode', () => {
    const existingRecipe = {
      name: 'Torta existente',
      category: 'cakes' as const,
      yield: 2,
      salePrice: 500,
      profitMargin: 60,
      notes: 'Notas existentes',
      imageUrl: 'https://example.com/img.jpg',
      ingredients: [
        { ingredientId: 'ing-1', name: 'Chocolate', quantity: 1, unit: 'kg', lineCost: 10 },
      ],
      calculatedCost: 10,
      suggestedPrice: 16,
      active: true,
    };

    beforeEach(() => {
      createComponent(existingRecipe);
    });

    it('pre-fills form data from DIALOG_DATA', () => {
      expect(component.name()).toBe('Torta existente');
      expect(component.notes()).toBe('Notas existentes');
      expect(component.imageUrl()).toBe('https://example.com/img.jpg');
      expect(component.recipeIngredients().length).toBe(1);
    });

    it('is not dirty initially', () => {
      expect(component.isDirty()).toBe(false);
    });

    it('becomes dirty after changing a field', () => {
      component.name.set('Torta modificada');
      expect(component.isDirty()).toBe(true);
    });

    it('becomes clean again after reverting a signal-backed change', () => {
      expect(component.isDirty()).toBe(false);

      component.profitMargin.set(80);
      expect(component.isDirty()).toBe(true);

      component.profitMargin.set(60);
      expect(component.isDirty()).toBe(false);
    });

    it('disables submit when not dirty', () => {
      component.next();
      component.next();
      component.next();
      fixture.detectChanges();

      const submitBtn = fixture.debugElement.query(By.css('.wizard__submit-btn'));
      expect(submitBtn).toBeTruthy();
      expect(submitBtn.nativeElement.disabled).toBe(true);
    });

    it('enables submit when dirty', () => {
      component.name.set('Torta diferente');
      component.next();
      component.next();
      component.next();
      fixture.detectChanges();

      const submitBtn = fixture.debugElement.query(By.css('.wizard__submit-btn'));
      expect(submitBtn.nativeElement.disabled).toBe(false);
    });

    it('shows "Guardar cambios" label on submit button', () => {
      component.name.set('Torta diferente');
      component.next();
      component.next();
      component.next();
      fixture.detectChanges();

      const submitBtn = fixture.debugElement.query(By.css('.wizard__submit-btn'));
      expect(submitBtn.nativeElement.textContent.trim()).toBe('Guardar cambios');
    });

    it('allows free navigation via goToStep when dirty', () => {
      component.name.set('Torta modificada');
      expect(component.isDirty()).toBe(true);

      component.goToStep(3);
      expect(component.currentStep()).toBe(3);
    });

    it('renders delete button in footer when in edit mode', () => {
      fixture.detectChanges();
      const deleteBtn = fixture.debugElement.query(By.css('.wizard__delete-btn'));
      expect(deleteBtn).toBeTruthy();
    });

    it('closes with "delete" on remove', () => {
      component.remove();
      expect(dialogRefMock.close).toHaveBeenCalledWith('delete');
    });
  });
});
