import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { RecipesComponent } from './recipes.component';
import { RecipesStore } from '../../core/store/recipes.store';
import { BottomSheetService } from '../../core/services/bottom-sheet.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/store/auth.store';
import type { Recipe } from '../../core/models/recipe';

const sampleRecipe: Recipe = {
  id: 'recipe-1',
  name: 'Cheesecake',
  category: 'cakes',
  ingredients: [{ ingredientId: 'ing-1', name: 'Queso crema', quantity: 1, unit: 'kg', lineCost: 12000 }],
  calculatedCost: 12000,
  profitMargin: 60,
  suggestedPrice: 19200,
  salePrice: 20000,
  yield: 10,
  notes: '',
  imageUrl: 'https://example.com/cheesecake.jpg',
  active: true,
};

describe('RecipesComponent', () => {
  let fixture: ComponentFixture<RecipesComponent>;
  let component: RecipesComponent;

  const recipesStoreMock = {
    recipes: signal<Recipe[]>([sampleRecipe]),
    createRecipe: vi.fn().mockResolvedValue('recipe-new'),
    updateRecipe: vi.fn().mockResolvedValue(undefined),
    deleteRecipe: vi.fn().mockResolvedValue(undefined),
  };

  const bottomSheetMock = {
    open: vi.fn(),
  };

  const notificationMock = {
    success: vi.fn(),
  };

  const authStoreMock = {
    isOwner: vi.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [RecipesComponent],
      providers: [
        { provide: RecipesStore, useValue: recipesStoreMock },
        { provide: BottomSheetService, useValue: bottomSheetMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: AuthStore, useValue: authStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates a recipe when the create modal closes with data', async () => {
    bottomSheetMock.open.mockReturnValueOnce({ afterClosed: of(sampleRecipe) });

    component.create();

    await vi.waitFor(() => {
      expect(recipesStoreMock.createRecipe).toHaveBeenCalledWith(sampleRecipe);
      expect(notificationMock.success).toHaveBeenCalledWith('Receta creada');
    });
  });

  it('does not create a recipe when modal closes without result', async () => {
    bottomSheetMock.open.mockReturnValueOnce({ afterClosed: of(undefined) });

    component.create();
    await Promise.resolve();

    expect(recipesStoreMock.createRecipe).not.toHaveBeenCalled();
  });

  it('updates a recipe when edit modal closes with new data', async () => {
    const updatedRecipe: Recipe = { ...sampleRecipe, name: 'Cheesecake XL' };
    bottomSheetMock.open.mockReturnValueOnce({ afterClosed: of(updatedRecipe) });

    component.edit(sampleRecipe);

    await vi.waitFor(() => {
      expect(recipesStoreMock.updateRecipe).toHaveBeenCalledWith('recipe-1', updatedRecipe);
      expect(notificationMock.success).toHaveBeenCalledWith('Receta actualizada');
    });
  });

  it('deletes a recipe when edit modal closes with delete action', async () => {
    bottomSheetMock.open.mockReturnValueOnce({ afterClosed: of('delete') });

    component.edit(sampleRecipe);

    await vi.waitFor(() => {
      expect(recipesStoreMock.deleteRecipe).toHaveBeenCalledWith('recipe-1');
      expect(notificationMock.success).toHaveBeenCalledWith('Receta eliminada');
    });
  });

  it('hides thumbnail after image load error', () => {
    expect(component.isThumbnailVisible(sampleRecipe)).toBe(true);

    component.onThumbnailError(sampleRecipe);

    expect(component.isThumbnailVisible(sampleRecipe)).toBe(false);
  });
});