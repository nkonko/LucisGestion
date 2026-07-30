import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AIGeneratedRecipe {
  name: string;
  description: string;
  category: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  steps: string[];
  estimatedCost?: number;
  estimatedTime?: string;
}

export interface AIRecipePrompt {
  ingredients?: string[];
  category?: string;
  dietaryRestrictions?: string[];
  cuisineType?: string;
  maxTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

@Injectable({
  providedIn: 'root'
})
export class AiRecipeService {
  private readonly API_URL = 'https://api.mistral.ai/v1';
  private readonly API_KEY = ''; // Configure in environment.ts

  constructor(private http: HttpClient) { }

  generateRecipe(prompt: AIRecipePrompt): Observable<AIGeneratedRecipe> {
    const mockRecipe: AIGeneratedRecipe = this.generateMockRecipe(prompt);
    return of(mockRecipe).pipe(
      catchError(error => {
        console.error('Error generating recipe:', error);
        return of(this.generateFallbackRecipe(prompt));
      })
    );
  }

  generateRecipeWithMistral(prompt: AIRecipePrompt): Observable<AIGeneratedRecipe> {
    const systemPrompt = `Eres un chef experto. Genera recetas detalladas y realistas en español. 
Formato de respuesta (JSON):
{
  "name": "nombre de la receta",
  "description": "descripción breve",
  "category": "categoría",
  "ingredients": [{"name": "ingrediente", "quantity": número, "unit": "unidad"}],
  "steps": ["paso 1", "paso 2", ...],
  "estimatedTime": "tiempo estimado",
  "estimatedCost": número
}`;

    const userPrompt = this.buildUserPrompt(prompt);
    const body = {
      model: 'mistral-tiny',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    return this.http.post<any>(`${this.API_URL}/chat/completions`, body, {
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      map(response => {
        try {
          const content = response.choices?.[0]?.message?.content || '';
          const jsonStart = content.indexOf('{');
          const jsonEnd = content.lastIndexOf('}') + 1;
          const jsonString = content.substring(jsonStart, jsonEnd);
          return JSON.parse(jsonString) as AIGeneratedRecipe;
        } catch (e) {
          console.error('Error parsing AI response:', e);
          return this.generateFallbackRecipe(prompt);
        }
      }),
      catchError(error => {
        console.error('Mistral API error:', error);
        return of(this.generateFallbackRecipe(prompt));
      })
    );
  }

  private generateMockRecipe(prompt: AIRecipePrompt): AIGeneratedRecipe {
    const mockRecipes: Record<string, AIGeneratedRecipe> = {
      postres: {
        name: 'Tarta de Chocolate con Frutos Rojos',
        description: 'Deliciosa tarta de chocolate con un toque de frutos rojos frescos',
        category: 'postres',
        ingredients: [
          { name: 'Chocolate negro', quantity: 200, unit: 'gr' },
          { name: 'Mantequilla', quantity: 150, unit: 'gr' },
          { name: 'Azúcar', quantity: 100, unit: 'gr' },
          { name: 'Huevos', quantity: 3, unit: 'unidades' },
          { name: 'Harina', quantity: 100, unit: 'gr' },
          { name: 'Frutos rojos', quantity: 200, unit: 'gr' }
        ],
        steps: [
          'Precalentar el horno a 180°C',
          'Derretir el chocolate y la mantequilla al baño María',
          'Mezclar el azúcar con los huevos hasta que estén espumosos',
          'Añadir el chocolate derretido a la mezcla de huevos',
          'Incorporar la harina tamizada',
          'Verter la mezcla en un molde y hornear por 25 minutos',
          'Dejar enfriar y decorar con frutos rojos'
        ],
        estimatedTime: '45 minutos',
        estimatedCost: 8.5
      },
      'platos principales': {
        name: 'Pasta a la Carbonara con Champiñones',
        description: 'Clásica pasta carbonara con un toque especial de champiñones',
        category: 'platos principales',
        ingredients: [
          { name: 'Pasta espagueti', quantity: 400, unit: 'gr' },
          { name: 'Panceta o bacon', quantity: 200, unit: 'gr' },
          { name: 'Huevos', quantity: 4, unit: 'unidades' },
          { name: 'Queso parmesano', quantity: 100, unit: 'gr' },
          { name: 'Champiñones', quantity: 200, unit: 'gr' },
          { name: 'Crema de leche', quantity: 100, unit: 'ml' }
        ],
        steps: [
          'Cocinar la pasta en agua con sal',
          'Dorar la panceta y el ajo en una sartén',
          'Añadir champiñones y cocinar',
          'Batir huevos con queso parmesano y crema',
          'Mezclar pasta con panceta y champiñones',
          'Añadir mezcla de huevos revolviendo constantemente',
          'Servir inmediatamente'
        ],
        estimatedTime: '30 minutos',
        estimatedCost: 12.0
      }
    };
    return mockRecipes[prompt.category?.toLowerCase() || 'platos principales'] 
      || mockRecipes['platos principales'];
  }

  private generateFallbackRecipe(prompt: AIRecipePrompt): AIGeneratedRecipe {
    return {
      name: 'Receta generada por IA',
      description: 'Receta generada automáticamente',
      category: prompt.category || 'platos principales',
      ingredients: [
        { name: 'Ingrediente 1', quantity: 100, unit: 'gr' },
        { name: 'Ingrediente 2', quantity: 200, unit: 'ml' }
      ],
      steps: ['Mezclar ingredientes', 'Cocinar 15 minutos', 'Servir'],
      estimatedTime: '20 minutos',
      estimatedCost: 10.0
    };
  }

  private buildUserPrompt(prompt: AIRecipePrompt): string {
    const parts = [];
    if (prompt.ingredients?.length) parts.push(`Usando: ${prompt.ingredients.join(', ')}`);
    if (prompt.category) parts.push(`Categoría: ${prompt.category}`);
    if (prompt.cuisineType) parts.push(`Cocina: ${prompt.cuisineType}`);
    if (prompt.dietaryRestrictions?.length) parts.push(`Restricciones: ${prompt.dietaryRestrictions.join(', ')}`);
    if (prompt.maxTime) parts.push(`Tiempo máx: ${prompt.maxTime}`);
    if (prompt.difficulty) parts.push(`Dificultad: ${prompt.difficulty}`);
    return parts.length > 0 ? `Crea una receta: ${parts.join('. ')}.` : 'Crea una receta deliciosa.';
  }
}
