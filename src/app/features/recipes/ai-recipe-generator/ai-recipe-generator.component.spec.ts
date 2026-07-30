import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AiRecipeGeneratorComponent } from './ai-recipe-generator.component';
import { AiRecipeService } from '../../core/services/ai-recipe.service';
import { RecipesStore } from '../../core/store/recipes.store';
import { of } from 'rxjs';

describe('AiRecipeGeneratorComponent', () => {
  let component: AiRecipeGeneratorComponent;
  let fixture: ComponentFixture<AiRecipeGeneratorComponent>;
  let aiServiceSpy: jasmine.SpyObj<AiRecipeService>;
  let recipesStoreSpy: jasmine.SpyObj<RecipesStore>;

  beforeEach(async () => {
    aiServiceSpy = jasmine.createSpyObj('AiRecipeService', ['generateRecipe']);
    recipesStoreSpy = jasmine.createSpyObj('RecipesStore', ['createRecipe']);

    await TestBed.configureTestingModule({
      imports: [AiRecipeGeneratorComponent],
      providers: [
        { provide: AiRecipeService, useValue: aiServiceSpy },
        { provide: RecipesStore, useValue: recipesStoreSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiRecipeGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add ingredient', () => {
    component.newIngredient.set('Harina');
    component.addIngredient();
    expect(component.ingredients().length).toBe(1);
    expect(component.ingredients()[0]).toBe('Harina');
  });

  it('should not add empty ingredient', () => {
    component.newIngredient.set('');
    component.addIngredient();
    expect(component.ingredients().length).toBe(0);
  });

  it('should remove ingredient', () => {
    component.ingredients.set(['Harina', 'Azúcar']);
    component.removeIngredient(0);
    expect(component.ingredients()).toEqual(['Azúcar']);
  });

  it('should generate recipe', fakeAsync(() => {
    const mockRecipe = {
      name: 'Test Recipe',
      description: 'Test',
      category: 'postres',
      ingredients: [],
      steps: []
    };
    aiServiceSpy.generateRecipe.and.returnValue(of(mockRecipe));

    component.generateRecipe();
    tick();

    expect(aiServiceSpy.generateRecipe).toHaveBeenCalled();
    expect(component.generatedRecipe()).toEqual(mockRecipe);
    expect(component.isGenerating()).toBe(false);
  }));

  it('should save recipe', () => {
    const mockRecipe = {
      name: 'Test Recipe',
      description: 'Test',
      category: 'postres',
      ingredients: [{ name: 'Harina', quantity: 100, unit: 'gr' }],
      steps: ['Paso 1'],
      estimatedTime: '30 min',
      estimatedCost: 10
    };
    component.generatedRecipe.set(mockRecipe);
    component.saveRecipe();
    expect(recipesStoreSpy.createRecipe).toHaveBeenCalled();
  });

  it('should reset form', () => {
    component.ingredients.set(['Harina']);
    component.category.set('postres');
    component.generatedRecipe.set({ name: 'Test' } as any);
    
    component.resetForm();
    
    expect(component.ingredients().length).toBe(0);
    expect(component.category()).toBe('');
    expect(component.generatedRecipe()).toBeNull();
  });
});
