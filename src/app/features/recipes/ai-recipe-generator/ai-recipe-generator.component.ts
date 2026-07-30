import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AiRecipeService, AIGeneratedRecipe, AIRecipePrompt } from '../../core/services/ai-recipe.service';
import { Recipe } from '../../core/models/recipe.model';
import { RecipesStore } from '../../core/store/recipes.store';

@Component({
  selector: 'app-ai-recipe-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ai-recipe-generator.component.html',
  styleUrl: './ai-recipe-generator.component.scss'
})
export class AiRecipeGeneratorComponent {
  private readonly aiService = inject(AiRecipeService);
  private readonly recipesStore = inject(RecipesStore);

  // Form state
  ingredients = signal<string[]>([]);
  newIngredient = signal('');
  category = signal<string>('');
  cuisineType = signal<string>('');
  dietaryRestrictions = signal<string[]>([]);
  newRestriction = signal('');
  maxTime = signal<string>('');
  difficulty = signal<'easy' | 'medium' | 'hard'>('medium');

  // UI state
  isGenerating = signal(false);
  generatedRecipe = signal<AIGeneratedRecipe | null>(null);
  error = signal<string | null>(null);

  categories = ['postres', 'platos principales', 'entrantes', 'bebidas', 'ensaladas', 'sopas'];
  cuisineTypes = ['italiana', 'mexicana', 'asiática', 'mediterránea', 'argentina', 'internacional'];
  difficultyLevels = ['easy', 'medium', 'hard'];

  constructor() {
    // Load default values or from localStorage
  }

  addIngredient() {
    const ingredient = this.newIngredient().trim();
    if (ingredient && !this.ingredients().includes(ingredient)) {
      this.ingredients.update(ings => [...ings, ingredient]);
      this.newIngredient.set('');
    }
  }

  removeIngredient(index: number) {
    this.ingredients.update(ings => ings.filter((_, i) => i !== index));
  }

  addRestriction() {
    const restriction = this.newRestriction().trim();
    if (restriction && !this.dietaryRestrictions().includes(restriction)) {
      this.dietaryRestrictions.update(rests => [...rests, restriction]);
      this.newRestriction.set('');
    }
  }

  removeRestriction(index: number) {
    this.dietaryRestrictions.update(rests => rests.filter((_, i) => i !== index));
  }

  generateRecipe() {
    this.isGenerating.set(true);
    this.error.set(null);
    this.generatedRecipe.set(null);

    const prompt: AIRecipePrompt = {
      ingredients: this.ingredients(),
      category: this.category(),
      cuisineType: this.cuisineType(),
      dietaryRestrictions: this.dietaryRestrictions(),
      maxTime: this.maxTime(),
      difficulty: this.difficulty()
    };

    this.aiService.generateRecipe(prompt).subscribe({
      next: (recipe) => {
        this.generatedRecipe.set(recipe);
        this.isGenerating.set(false);
      },
      error: (err) => {
        this.error.set('Error al generar la receta. Por favor, inténtalo de nuevo.');
        this.isGenerating.set(false);
      }
    });
  }

  saveRecipe() {
    const aiRecipe = this.generatedRecipe();
    if (!aiRecipe) return;

    const recipe: Partial<Recipe> = {
      name: aiRecipe.name,
      description: aiRecipe.description,
      category: aiRecipe.category,
      ingredients: aiRecipe.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit
      })),
      steps: aiRecipe.steps,
      estimatedTime: aiRecipe.estimatedTime,
      estimatedCost: aiRecipe.estimatedCost || 0,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.recipesStore.createRecipe(recipe as Recipe);
    this.resetForm();
  }

  resetForm() {
    this.ingredients.set([]);
    this.newIngredient.set('');
    this.category.set('');
    this.cuisineType.set('');
    this.dietaryRestrictions.set([]);
    this.newRestriction.set('');
    this.maxTime.set('');
    this.difficulty.set('medium');
    this.generatedRecipe.set(null);
    this.error.set(null);
  }

  tryAgain() {
    this.generateRecipe();
  }
}
