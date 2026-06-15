import { Component, computed, inject, signal } from '@angular/core';
import { UiIconComponent } from '../../../shared/ui/components';
import { DIALOG_DATA } from '../../../core/models/dialog/dialog-tokens.model';
import { GeminiRecommendation } from '../../../core/services/gemini-recommendations.service';
import { RecommendationsPdfService } from '../services/recommendations-pdf.service';

interface RecommendationsDialogData {
  recommendations: GeminiRecommendation[];
  periodLabel?: string;
}

@Component({
  selector: 'app-recommendations-bottom-sheet',
  imports: [UiIconComponent],
  templateUrl: './recommendations-bottom-sheet.component.html',
  styleUrl: './recommendations-bottom-sheet.component.scss',
})
export class RecommendationsBottomSheetComponent {
  private readonly rawData = inject(DIALOG_DATA, { optional: true }) as
    | RecommendationsDialogData
    | GeminiRecommendation[]
    | GeminiRecommendation
    | null;
  private readonly recommendationsPdfService = inject(RecommendationsPdfService);
  readonly currentIndex = signal(0);
  readonly recommendations = this.normalizeRecommendations(this.rawData);
  readonly periodLabel = this.resolvePeriodLabel(this.rawData);
  readonly totalRecommendations = this.recommendations.length;
  readonly currentRecommendation = computed(() => this.recommendations[this.currentIndex()] ?? null);
  readonly hasMultipleRecommendations = computed(() => this.totalRecommendations > 1);

  readonly urgencyLabels: Record<string, string> = {
    alta: 'Urgente',
    media: 'Importante',
    baja: 'Optimización',
  };

  previousRecommendation(): void {
    const nextIndex = this.currentIndex() - 1;
    if (nextIndex >= 0) {
      this.currentIndex.set(nextIndex);
    }
  }

  nextRecommendation(): void {
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex < this.totalRecommendations) {
      this.currentIndex.set(nextIndex);
    }
  }

  exportPdf(): void {
    if (this.recommendations.length === 0) {
      return;
    }
    this.recommendationsPdfService.exportRecommendations(this.recommendations, this.periodLabel);
  }

  getUrgencyLabel(urgency: GeminiRecommendation['urgency']): string {
    return this.urgencyLabels[urgency] ?? this.urgencyLabels['media'];
  }

  private normalizeRecommendations(
    data: RecommendationsDialogData | GeminiRecommendation[] | GeminiRecommendation | null,
  ): GeminiRecommendation[] {
    if (!data) {
      return [];
    }
    if (this.isDialogPayload(data)) {
      return data.recommendations;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [data];
  }

  private resolvePeriodLabel(
    data: RecommendationsDialogData | GeminiRecommendation[] | GeminiRecommendation | null,
  ): string {
    if (data && this.isDialogPayload(data) && data.periodLabel) {
      return data.periodLabel;
    }
    return 'Actual';
  }

  private isDialogPayload(
    data: RecommendationsDialogData | GeminiRecommendation[] | GeminiRecommendation,
  ): data is RecommendationsDialogData {
    return !Array.isArray(data) && typeof data === 'object' && 'recommendations' in data;
  }
}
