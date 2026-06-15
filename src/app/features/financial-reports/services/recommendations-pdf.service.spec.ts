import { TestBed } from '@angular/core/testing';
import { RecommendationsPdfService } from './recommendations-pdf.service';
import type { GeminiRecommendation } from '../../../core/services/gemini-recommendations.service';

describe('RecommendationsPdfService', () => {
  let service: RecommendationsPdfService;

  const mockRecommendation: GeminiRecommendation = {
    title: 'Recommendation 1',
    description: 'This is a test recommendation',
    actionItems: ['Action 1', 'Action 2'],
    urgency: 'alta',
    isLocal: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecommendationsPdfService],
    });
    service = TestBed.inject(RecommendationsPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle empty recommendations without error', () => {
    expect(() => service.exportRecommendations([], 'Junio 2026')).not.toThrow();
  });

  it('should export single recommendation', () => {
    expect(() =>
      service.exportRecommendations([mockRecommendation], 'Junio 2026'),
    ).not.toThrow();
  });

  it('should export multiple recommendations', () => {
    const recommendations: GeminiRecommendation[] = [
      mockRecommendation,
      {
        title: 'Recommendation 2',
        description: 'Another test recommendation',
        actionItems: ['Action 3'],
        urgency: 'media',
        isLocal: true,
      },
      {
        title: 'Recommendation 3',
        description: 'Third test recommendation',
        actionItems: ['Action 4', 'Action 5', 'Action 6'],
        urgency: 'baja',
        isLocal: false,
      },
    ];

    expect(() => service.exportRecommendations(recommendations, 'Junio 2026')).not.toThrow();
  });

  it('should handle different urgency levels', () => {
    const recommendationsWithDifferentUrgencies: GeminiRecommendation[] = [
      { ...mockRecommendation, urgency: 'alta' },
      { ...mockRecommendation, urgency: 'media' },
      { ...mockRecommendation, urgency: 'baja' },
    ];

    expect(() =>
      service.exportRecommendations(recommendationsWithDifferentUrgencies, 'Junio 2026'),
    ).not.toThrow();
  });

  it('should handle local and API recommendations', () => {
    const recommendations: GeminiRecommendation[] = [
      { ...mockRecommendation, isLocal: true },
      { ...mockRecommendation, isLocal: false },
    ];

    expect(() => service.exportRecommendations(recommendations, 'Junio 2026')).not.toThrow();
  });
});
