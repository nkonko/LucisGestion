import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RecipeFormComponent } from './recipe-form.component';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { DIALOG_DATA, DIALOG_REF } from '../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../core/models/dialog/dialog-ref.model';
import type { Ingredient } from '../../core/models/ingredient';

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

  it('does not add ingredients while typing and only adds on explicit selection action', () => {
    component.ingredientSearch.set('Choco');
    expect(component.recipeIngredients()).toHaveLength(0);

    component.ingredientSearch.set('Chocolate');
    expect(component.recipeIngredients()).toHaveLength(0);

    component.addSelectedIngredient();

    expect(component.recipeIngredients()).toHaveLength(1);
    expect(component.recipeIngredients()[0].name).toBe('Chocolate');
  });

  it('recomputes suggested price when profit margin changes', () => {
    component.addIngredient(ingredients[0]);

    const previous = component.suggestedPrice();
    component.onProfitMarginChange(120);
    const next = component.suggestedPrice();

    expect(next).toBeGreaterThan(previous);
  });
});
