import { computed, inject, Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { environment } from '../../../environments/environment';
import { FinancialInsightsService } from './financial-insights.service';
import { DashboardMetricsService } from './dashboard-metrics.service';

export interface GeminiRecommendation {
  title: string;
  description: string;
  actionItems: string[];
  urgency: 'alta' | 'media' | 'baja';
  isLocal?: boolean;
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

@Injectable({ providedIn: 'root' })
export class GeminiRecommendationsService {
  private financialInsights = inject(FinancialInsightsService);
  private metrics = inject(DashboardMetricsService);

  readonly isConfigured = computed(() => {
    const apiKey = environment.gemini?.apiKey;
    return apiKey && apiKey !== 'YOUR_GEMINI_API_KEY';
  });

  async generateRecommendations(periodLabel: string): Promise<GeminiRecommendation[]> {
    return Sentry.startSpan(
      {
        name: 'generateRecommendations',
        op: 'http.client',
      },
      async () => {
        if (!this.isConfigured()) {
          return [this.generateLocalRecommendations()];
        }

        try {
          const prompt = this.buildPrompt(periodLabel);
          const response = await this.callGeminiApi(prompt);
          const parsed = this.parseGeminiResponse(response);
          return parsed ?? [this.generateLocalRecommendations()];
        } catch (error: unknown) {
          this.captureGeminiException(error, 'generate_recommendations', {
            periodLabel,
          });
          console.error('Error calling Gemini API:', error);
          return [this.generateLocalRecommendations()];
        }
      },
    );
  }

  private buildPrompt(periodLabel: string): string {
    const insights = this.financialInsights.insights();
    const monthlySales = this.metrics.monthlySales();
    const netProfit = this.metrics.netProfit();
    const profitRate = monthlySales > 0 ? Math.round((netProfit / monthlySales) * 100) : 0;

    const insightsText = insights
      .map(
        (insight) =>
          `- ${insight.title}: ${insight.description}. ${insight.recommendation ?? ''}`,
      )
      .join('\n');

    return `Eres un asesor financiero experto para pequeños negocios.

Analiza estos datos del período "${periodLabel}" y genera 3-5 recomendaciones accionables:

**Métricas principales:**
- Ventas: $${monthlySales.toLocaleString('es-AR')}
- Ganancia neta: $${netProfit.toLocaleString('es-AR')}
- Tasa de ganancia: ${profitRate}%

**Insights automáticos detectados:**
${insightsText}

Basándote en estos datos, proporciona recomendaciones en JSON con este formato:
{
  "titulo": "Nombre descriptivo de la recomendación",
  "descripcion": "Explicación concisa de por qué es importante",
  "accionesRecomendadas": ["Acción 1", "Acción 2", "Acción 3"],
  "urgencia": "alta" | "media" | "baja"
}

Solo responde con JSON válido, sin markdown, comentarios adicionales o explicaciones.`;
  }

  private async callGeminiApi(prompt: string): Promise<GeminiResponse> {
    const apiKey = environment.gemini?.apiKey;
    const model = environment.gemini?.model ?? 'gemini-2.5-flash';
    const baseUrl = environment.gemini?.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta/models';

    const url = `${baseUrl}/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error ${response.status}:`, errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<GeminiResponse>;
    } catch (error: unknown) {
      console.error('Gemini API call failed:', {
        error: error instanceof Error ? error.message : String(error),
        apiKeyConfigured: !!apiKey && apiKey !== 'YOUR_GEMINI_API_KEY',
        model,
        baseUrl,
      });
      throw error;
    }
  }

  private parseGeminiResponse(response: GeminiResponse): GeminiRecommendation[] | null {
    try {
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return null;
      }

      let cleanText = text.replace(/```json\n?|\n?```/g, '').trim();

      const arrayStart = cleanText.indexOf('[');
      const arrayEnd = cleanText.lastIndexOf(']');
      if (arrayStart !== -1 && arrayEnd > arrayStart) {
        cleanText = cleanText.slice(arrayStart, arrayEnd + 1);
      } else {
        const objectStart = cleanText.indexOf('{');
        const objectEnd = cleanText.lastIndexOf('}');
        if (objectStart !== -1 && objectEnd > objectStart) {
          cleanText = cleanText.slice(objectStart, objectEnd + 1);
        }
      }

      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((item) => this.normalizeRecommendation(item));
        return normalized.filter((item): item is GeminiRecommendation => item !== null);
      }

      const objectWithList = parsed as { recomendaciones?: unknown };
      if (Array.isArray(objectWithList.recomendaciones)) {
        const normalized = objectWithList.recomendaciones.map((item) => this.normalizeRecommendation(item));
        return normalized.filter((item): item is GeminiRecommendation => item !== null);
      }

      const single = this.normalizeRecommendation(parsed);
      return single ? [single] : null;
    } catch (error: unknown) {
      this.captureGeminiException(error, 'parse_response', {
        candidateCount: response.candidates.length,
      });
      console.error('Error parsing Gemini response:', error);
      return null;
    }
  }

  private captureGeminiException(
    error: unknown,
    operation: string,
    extra?: Record<string, unknown>,
  ): void {
    Sentry.captureException(error, {
      tags: {
        area: 'gemini',
        operation,
      },
      extra,
    });
  }

  private normalizeRecommendation(input: unknown): GeminiRecommendation | null {
    if (!input || typeof input !== 'object') {
      return null;
    }

    const record = input as {
      titulo?: unknown;
      descripcion?: unknown;
      accionesRecomendadas?: unknown;
      urgencia?: unknown;
      title?: unknown;
      description?: unknown;
      actionItems?: unknown;
      urgency?: unknown;
    };

    const title = typeof record.titulo === 'string'
      ? record.titulo
      : typeof record.title === 'string'
        ? record.title
        : 'Recomendación';

    const description = typeof record.descripcion === 'string'
      ? record.descripcion
      : typeof record.description === 'string'
        ? record.description
        : '';

    const rawActions = Array.isArray(record.accionesRecomendadas)
      ? record.accionesRecomendadas
      : Array.isArray(record.actionItems)
        ? record.actionItems
        : [];

    const actionItems = rawActions
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .slice(0, 5);

    const rawUrgency = typeof record.urgencia === 'string'
      ? record.urgencia
      : typeof record.urgency === 'string'
        ? record.urgency
        : 'media';

    const urgency = rawUrgency === 'alta' || rawUrgency === 'media' || rawUrgency === 'baja'
      ? rawUrgency
      : 'media';

    return {
      title,
      description,
      actionItems,
      urgency,
    };
  }

  private generateLocalRecommendations(): GeminiRecommendation {
    const insights = this.financialInsights.insights();
    const metrics = this.metrics;
    const profitRate = metrics.monthlySales() > 0
      ? Math.round((metrics.netProfit() / metrics.monthlySales()) * 100)
      : 0;

    let title: string;
    let urgency: 'alta' | 'media' | 'baja';
    let description: string;
    let actionItems: string[];

    // Lógica simple para fallback local
    if (metrics.netProfit() < 0) {
      title = 'Acción urgente: Rentabilidad negativa';
      urgency = 'alta';
      description =
        'Tu negocio está operando con pérdidas. Revisa inmediatamente tus costos y estrategia de precios.';
      actionItems = [
        'Analiza los costos de cada línea de producto',
        'Considera aumentar precios o reducir costos de producción',
        'Revisa los clientes de bajo margen',
      ];
    } else if (profitRate < 15) {
      title = 'Margen de ganancia bajo';
      urgency = 'media';
      description = `Tu tasa de ganancia es ${profitRate}%, por debajo del promedio para pequeños negocios.`;
      actionItems = [
        'Identifica productos de bajo margen para optimizar',
        'Negocia mejores términos con proveedores',
        'Considera productos complementarios de mayor margen',
      ];
    } else {
      title = 'Negocio saludable';
      urgency = 'baja';
      description = `Tu negocio muestra una tasa de ganancia de ${profitRate}%. Enfócate en mantener esta tendencia.`;
      actionItems = [
        'Mantén los procesos que funcionan bien',
        'Considera invertir en expansion selective',
        insights.length > 0 ? 'Actúa sobre los insights detectados' : 'Monitorea continuamente',
      ];
    }

    // Agregar insights detectados a las acciones
    if (insights.length > 0) {
      const insightsSummary = insights
        .slice(0, 2)
        .map((i) => i.title)
        .join(', ');
      actionItems.push(`Atiende los siguientes insights: ${insightsSummary}`);
    }

    return {
      title,
      description,
      actionItems: actionItems.slice(0, 5),
      urgency,
      isLocal: true,
    };
  }
}
