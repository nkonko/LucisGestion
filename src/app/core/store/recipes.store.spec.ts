import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecipesStore } from './recipes.store';
import { FirestoreService } from '../services/firestore.service';
import { IngredientsStore } from './ingredients.store';

describe('RecipesStore', () => {
  let store: InstanceType<typeof RecipesStore>;
  let firestore: {
    getCollection: ReturnType<typeof vi.fn>;
    addDocument: ReturnType<typeof vi.fn>;
    updateDocument: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    firestore = {
      getCollection: vi.fn().mockReturnValue(of([])),
      addDocument: vi.fn().mockResolvedValue('recipe-1'),
      updateDocument: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        RecipesStore,
        { provide: FirestoreService, useValue: firestore },
        {
          provide: IngredientsStore,
          useValue: {
            ingredients: () => [{ id: 'ing-1', unitPrice: 10, currentStock: 20, minimumStock: 1, name: 'Harina', category: 'dry', unit: 'kg', lastPurchase: null, active: true }],
          },
        },
      ],
    });

    store = TestBed.inject(RecipesStore);
  });

  it('calculates cost and suggested price on create', async () => {
    await store.createRecipe({
      name: 'Pan',
      category: 'cakes',
      ingredients: [{ ingredientId: 'ing-1', name: 'Harina', quantity: 2, unit: 'kg', lineCost: 0 }],
      profitMargin: 0.5,
      salePrice: 0,
      yield: 1,
      notes: '',
      imageUrl: '',
      calculatedCost: 0,
      suggestedPrice: 0,
      active: true,
    });

    expect(firestore.addDocument).toHaveBeenCalledWith('recipes', expect.objectContaining({ calculatedCost: 20, suggestedPrice: 21, salePrice: 21, active: true }));
  });

  it('recalculates cost and suggested price on update when ingredients/margin change', async () => {
    firestore.getCollection.mockReturnValue(
      of([{ id: 'recipe-1', name: 'Pan', category: 'cakes', ingredients: [{ ingredientId: 'ing-1', name: 'Harina', quantity: 1, unit: 'kg', lineCost: 0 }], calculatedCost: 10, profitMargin: 0.4, suggestedPrice: 14, salePrice: 14, yield: 1, notes: '', imageUrl: '', active: true }]),
    );
    store = TestBed.inject(RecipesStore);

    await store.updateRecipe('recipe-1', { profitMargin: 1 });

    expect(firestore.updateDocument).toHaveBeenCalledWith('recipes', 'recipe-1', expect.objectContaining({ calculatedCost: 0, suggestedPrice: 0, profitMargin: 1 }));
  });
});
