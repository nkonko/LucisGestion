import { TestBed } from '@angular/core/testing';
import { StockService } from './stock.service';
import { IngredientsStore } from '../store/ingredients.store';
import { RecipesStore } from '../store/recipes.store';
import { Ingredient } from '../models/ingredient';
import { Recipe } from '../models/recipe';
import type { MeasurementUnit } from '../models/ingredient';
import type { IngredientCategory } from '../models/ingredient';

type MockRecipe = Omit<Recipe, 'category'> & { category: string };
type MockIngredient = Omit<Ingredient, 'unit' | 'category'> & { unit: string; category: string };

function asRecipe(r: MockRecipe): Recipe {
  return r as Recipe;
}

function asIngredient(i: MockIngredient): Ingredient {
  return i as Ingredient;
}

describe('StockService', () => {
  let service: StockService;

  function mockRecipes(recipes: Recipe[]) {
    return { recipes: () => recipes };
  }

  function mockIngredients(ingredients: Ingredient[]) {
    return { ingredients: () => ingredients };
  }

  function configure(recipes: Recipe[], ingredients: Ingredient[]) {
    TestBed.configureTestingModule({
      providers: [
        StockService,
        { provide: RecipesStore, useValue: mockRecipes(recipes) },
        { provide: IngredientsStore, useValue: mockIngredients(ingredients) },
      ],
    });
    service = TestBed.inject(StockService);
  }

  describe('buildStockAdjustments', () => {
    it('returns adjustments with factor -1 for deduction', () => {
      configure(
        [
          asRecipe({
            id: 'rec-1', name: 'Torta', category: 'desserts', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina', quantity: 2, unit: 'kg' as MeasurementUnit, lineCost: 10 },
              { ingredientId: 'ing-2', name: 'Azúcar', quantity: 1, unit: 'kg' as MeasurementUnit, lineCost: 5 },
            ],
            calculatedCost: 15, profitMargin: 30, suggestedPrice: 20, salePrice: 25,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
        ],
        [
          asIngredient({ id: 'ing-1', name: 'Harina', unit: 'kg' as MeasurementUnit, unitPrice: 5, currentStock: 10, minimumStock: 2, category: 'dry' as IngredientCategory, lastPurchase: null, active: true }),
          asIngredient({ id: 'ing-2', name: 'Azúcar', unit: 'kg' as MeasurementUnit, unitPrice: 5, currentStock: 10, minimumStock: 2, category: 'sugars' as IngredientCategory, lastPurchase: null, active: true }),
        ],
      );

      const result = service.buildStockAdjustments([{ recipeId: 'rec-1', quantity: 3 }], -1);

      expect(result).toEqual([
        { ingredientId: 'ing-1', ingredientName: 'Harina', delta: -6 },
        { ingredientId: 'ing-2', ingredientName: 'Azúcar', delta: -3 },
      ]);
    });

    it('returns adjustments with factor 1 for restock', () => {
      configure(
        [
          asRecipe({
            id: 'rec-1', name: 'Torta', category: 'desserts', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina', quantity: 2, unit: 'kg' as MeasurementUnit, lineCost: 10 },
            ],
            calculatedCost: 10, profitMargin: 30, suggestedPrice: 13, salePrice: 15,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
        ],
        [
          asIngredient({ id: 'ing-1', name: 'Harina', unit: 'kg' as MeasurementUnit, unitPrice: 5, currentStock: 10, minimumStock: 2, category: 'dry' as IngredientCategory, lastPurchase: null, active: true }),
        ],
      );

      const result = service.buildStockAdjustments([{ recipeId: 'rec-1', quantity: 2 }], 1);

      expect(result).toEqual([
        { ingredientId: 'ing-1', ingredientName: 'Harina', delta: 4 },
      ]);
    });

    it('groups same ingredient across multiple items', () => {
      configure(
        [
          asRecipe({
            id: 'rec-1', name: 'Pan', category: 'breads', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina', quantity: 1, unit: 'kg' as MeasurementUnit, lineCost: 5 },
            ],
            calculatedCost: 5, profitMargin: 30, suggestedPrice: 7, salePrice: 10,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
          asRecipe({
            id: 'rec-2', name: 'Torta', category: 'desserts', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina', quantity: 2, unit: 'kg' as MeasurementUnit, lineCost: 5 },
            ],
            calculatedCost: 10, profitMargin: 30, suggestedPrice: 13, salePrice: 15,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
        ],
        [
          asIngredient({ id: 'ing-1', name: 'Harina', unit: 'kg' as MeasurementUnit, unitPrice: 5, currentStock: 10, minimumStock: 2, category: 'dry' as IngredientCategory, lastPurchase: null, active: true }),
        ],
      );

      const result = service.buildStockAdjustments(
        [{ recipeId: 'rec-1', quantity: 2 }, { recipeId: 'rec-2', quantity: 1 }],
        -1,
      );

      expect(result).toEqual([
        { ingredientId: 'ing-1', ingredientName: 'Harina', delta: -4 },
      ]);
    });

    it('skips recipes not found in store', () => {
      configure([], []);

      const result = service.buildStockAdjustments([{ recipeId: 'unknown', quantity: 1 }], -1);

      expect(result).toEqual([]);
    });

    it('uses recipe ingredient name when ingredient not in store', () => {
      configure(
        [
          asRecipe({
            id: 'rec-1', name: 'Torta', category: 'desserts', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina Integral', quantity: 1, unit: 'kg' as MeasurementUnit, lineCost: 5 },
            ],
            calculatedCost: 5, profitMargin: 30, suggestedPrice: 7, salePrice: 10,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
        ],
        [],
      );

      const result = service.buildStockAdjustments([{ recipeId: 'rec-1', quantity: 1 }], -1);

      expect(result).toEqual([
        { ingredientId: 'ing-1', ingredientName: 'Harina Integral', delta: -1 },
      ]);
    });
  });

  describe('validateStockForCreation', () => {
    it('passes when stock is sufficient', () => {
      configure(
        [
          asRecipe({
            id: 'rec-1', name: 'Torta', category: 'desserts', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina', quantity: 2, unit: 'kg' as MeasurementUnit, lineCost: 10 },
            ],
            calculatedCost: 10, profitMargin: 30, suggestedPrice: 13, salePrice: 15,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
        ],
        [
          asIngredient({ id: 'ing-1', name: 'Harina', unit: 'kg' as MeasurementUnit, unitPrice: 5, currentStock: 10, minimumStock: 2, category: 'dry' as IngredientCategory, lastPurchase: null, active: true }),
        ],
      );

      expect(() => { service.validateStockForCreation([{ recipeId: 'rec-1', quantity: 3 }]); }).not.toThrow();
    });

    it('throws when stock is insufficient', () => {
      configure(
        [
          asRecipe({
            id: 'rec-1', name: 'Torta', category: 'desserts', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina', quantity: 2, unit: 'kg' as MeasurementUnit, lineCost: 10 },
            ],
            calculatedCost: 10, profitMargin: 30, suggestedPrice: 13, salePrice: 15,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
        ],
        [
          asIngredient({ id: 'ing-1', name: 'Harina', unit: 'kg' as MeasurementUnit, unitPrice: 5, currentStock: 3, minimumStock: 2, category: 'dry' as IngredientCategory, lastPurchase: null, active: true }),
        ],
      );

      expect(() => { service.validateStockForCreation([{ recipeId: 'rec-1', quantity: 3 }]); })
        .toThrow('Stock insuficiente para registrar la venta: Harina (faltan 3.00 kg)');
    });

    it('skips ingredients without currentStock (untracked)', () => {
      configure(
        [
          asRecipe({
            id: 'rec-1', name: 'Torta', category: 'desserts', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina', quantity: 2, unit: 'kg' as MeasurementUnit, lineCost: 10 },
            ],
            calculatedCost: 10, profitMargin: 30, suggestedPrice: 13, salePrice: 15,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
        ],
        [
          asIngredient({ id: 'ing-1', name: 'Harina', unit: 'kg' as MeasurementUnit, unitPrice: 5, currentStock: 0, minimumStock: 2, category: 'dry' as IngredientCategory, lastPurchase: null, active: true }),
        ],
      );

      expect(() => { service.validateStockForCreation([{ recipeId: 'rec-1', quantity: 3 }]); })
        .toThrow('faltan 6.00');
    });

    it('passes with no items', () => {
      configure([], []);
      expect(() => { service.validateStockForCreation([]); }).not.toThrow();
    });
  });

  describe('validateStockForEdition', () => {
    it('passes when extra needed is within stock', () => {
      configure(
        [
          asRecipe({
            id: 'rec-1', name: 'Torta', category: 'desserts', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina', quantity: 1, unit: 'kg' as MeasurementUnit, lineCost: 5 },
            ],
            calculatedCost: 5, profitMargin: 30, suggestedPrice: 7, salePrice: 10,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
        ],
        [
          asIngredient({ id: 'ing-1', name: 'Harina', unit: 'kg' as MeasurementUnit, unitPrice: 5, currentStock: 8, minimumStock: 2, category: 'dry' as IngredientCategory, lastPurchase: null, active: true }),
        ],
      );

      expect(() => {
        service.validateStockForEdition(
          [{ recipeId: 'rec-1', quantity: 1 }],
          [{ recipeId: 'rec-1', quantity: 5 }],
        );
      }).not.toThrow();
    });

    it('throws when extra needed exceeds stock', () => {
      configure(
        [
          asRecipe({
            id: 'rec-1', name: 'Torta', category: 'desserts', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina', quantity: 1, unit: 'kg' as MeasurementUnit, lineCost: 5 },
            ],
            calculatedCost: 5, profitMargin: 30, suggestedPrice: 7, salePrice: 10,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
        ],
        [
          asIngredient({ id: 'ing-1', name: 'Harina', unit: 'kg' as MeasurementUnit, unitPrice: 5, currentStock: 2, minimumStock: 2, category: 'dry' as IngredientCategory, lastPurchase: null, active: true }),
        ],
      );

      expect(() => {
        service.validateStockForEdition(
          [{ recipeId: 'rec-1', quantity: 1 }],
          [{ recipeId: 'rec-1', quantity: 10 }],
        );
      }).toThrow('Stock insuficiente para modificar la venta');
    });

    it('passes when quantity decreases', () => {
      configure(
        [
          asRecipe({
            id: 'rec-1', name: 'Torta', category: 'desserts', ingredients: [
              { ingredientId: 'ing-1', name: 'Harina', quantity: 1, unit: 'kg' as MeasurementUnit, lineCost: 5 },
            ],
            calculatedCost: 5, profitMargin: 30, suggestedPrice: 7, salePrice: 10,
            yield: 1, notes: '', imageUrl: '', active: true,
          }),
        ],
        [
          asIngredient({ id: 'ing-1', name: 'Harina', unit: 'kg' as MeasurementUnit, unitPrice: 5, currentStock: 1, minimumStock: 2, category: 'dry' as IngredientCategory, lastPurchase: null, active: true }),
        ],
      );

      expect(() => {
        service.validateStockForEdition(
          [{ recipeId: 'rec-1', quantity: 5 }],
          [{ recipeId: 'rec-1', quantity: 1 }],
        );
      }).not.toThrow();
    });
  });
});
