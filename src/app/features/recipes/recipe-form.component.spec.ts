import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RecipeFormComponent } from './recipe-form.component';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { DIALOG_DATA, DIALOG_REF } from '../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../core/models/dialog/dialog-ref.model';
import type { Ingredient, RecipeIngredient } from '../../core/models/ingredient';

describe('RecipeFormComponent', () => {
  let fixture: ComponentFixture<RecipeFormComponent>;
  let component: RecipeFormComponent;

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

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [RecipeFormComponent],
      providers: [
        { provide: DIALOG_REF, useValue: dialogRefMock },
        { provide: DIALOG_DATA, useValue: null },
        { provide: IngredientsStore, useValue: ingredientsStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('recomputes suggested price when profit margin changes', () => {
    const recipeIngredients: RecipeIngredient[] = [
      {
        ingredientId: 'ing-1',
        name: 'Chocolate',
        quantity: 1,
        unit: 'kg',
        lineCost: 10,
      },
    ];

    component.recipeIngredients.set(recipeIngredients);

    const previous = component.suggestedPrice();
    component.profitMargin.set(120);
    const next = component.suggestedPrice();

    expect(next).toBeGreaterThan(previous);
  });

  it('uses suggested price when final sale price is 0', () => {
    const recipeIngredients: RecipeIngredient[] = [
      {
        ingredientId: 'ing-1',
        name: 'Chocolate',
        quantity: 2,
        unit: 'kg',
        lineCost: 20,
      },
    ];

    component.form.name = 'Torta de chocolate';
    component.form.salePrice = 0;
    component.recipeIngredients.set(recipeIngredients);

    const suggested = component.suggestedPrice();
    component.save();

    expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
    expect(dialogRefMock.close).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Torta de chocolate',
        ingredients: recipeIngredients,
        salePrice: suggested,
        suggestedPrice: suggested,
        profitMargin: component.profitMargin(),
      }),
    );
  });
});
