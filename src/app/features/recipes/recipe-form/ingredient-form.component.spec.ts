import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { Ingredient, RecipeIngredient } from '../../../core/models/ingredient';
import { IngredientsStore } from '../../../core/store/ingredients.store';
import { IngredientFormComponent } from './ingredient-form.component';

describe('IngredientFormComponent', () => {
  let fixture: ComponentFixture<IngredientFormComponent>;
  let component: IngredientFormComponent;

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
      name: 'Azucar',
      unit: 'kg',
      unitPrice: 4,
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

  const setRecipeIngredientsInput = (value: RecipeIngredient[]) => {
    fixture.componentRef.setInput('recipeIngredients', value);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngredientFormComponent],
      providers: [{ provide: IngredientsStore, useValue: ingredientsStoreMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientFormComponent);
    component = fixture.componentInstance;
  });

  it('adds ingredient only when exact ingredient name is selected', () => {
    setRecipeIngredientsInput([]);
    const emitSpy = vi.fn();
    component.recipeIngredientsChange.subscribe(emitSpy);

    component.ingredientSearch.set('Choco');
    component.addSelectedIngredient();

    expect(emitSpy).not.toHaveBeenCalled();

    component.ingredientSearch.set('Chocolate');
    component.addSelectedIngredient();

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        ingredientId: 'ing-1',
        name: 'Chocolate',
        quantity: 1,
      }),
    ]);
    expect(component.ingredientSearch()).toBe('');
  });

  it('emits updated list with recomputed line cost on quantity update', () => {
    setRecipeIngredientsInput([
      {
        ingredientId: 'ing-1',
        name: 'Chocolate',
        quantity: 1,
        unit: 'kg',
        lineCost: 10,
      },
    ]);
    const emitSpy = vi.fn();
    component.recipeIngredientsChange.subscribe(emitSpy);

    component.updateQuantity(0, 2.5);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy.mock.calls[0][0]).toEqual([
      {
        ingredientId: 'ing-1',
        name: 'Chocolate',
        quantity: 2.5,
        unit: 'kg',
        lineCost: 25,
      },
    ]);
  });

  it('emits filtered list when an ingredient is removed', () => {
    setRecipeIngredientsInput([
      {
        ingredientId: 'ing-1',
        name: 'Chocolate',
        quantity: 1,
        unit: 'kg',
        lineCost: 10,
      },
      {
        ingredientId: 'ing-2',
        name: 'Azucar',
        quantity: 1,
        unit: 'kg',
        lineCost: 4,
      },
    ]);
    const emitSpy = vi.fn();
    component.recipeIngredientsChange.subscribe(emitSpy);

    component.removeIngredient(0);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy.mock.calls[0][0]).toEqual([
      {
        ingredientId: 'ing-2',
        name: 'Azucar',
        quantity: 1,
        unit: 'kg',
        lineCost: 4,
      },
    ]);
  });
});
