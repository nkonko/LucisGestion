import { TestBed } from '@angular/core/testing';
import { GeminiRecommendationsService } from './gemini-recommendations.service';
import { FinancialInsightsService } from './financial-insights.service';
import { DashboardMetricsService } from './dashboard-metrics.service';

describe('GeminiRecommendationsService', () => {
  let service: GeminiRecommendationsService;
  const financialInsightsSpy = {
    insights: vi.fn().mockReturnValue([]),
    periodSales: vi.fn().mockReturnValue([]),
  };

  const metricsSpy = {
    monthlySales: vi.fn().mockReturnValue(10000),
    monthlyExpenses: vi.fn().mockReturnValue(5000),
    periodFixedCosts: vi.fn().mockReturnValue(2000),
    periodVariableExpenses: vi.fn().mockReturnValue(3000),
    netProfit: vi.fn().mockReturnValue(5000),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    financialInsightsSpy.insights.mockReturnValue([]);
    financialInsightsSpy.periodSales.mockReturnValue([]);
    metricsSpy.monthlySales.mockReturnValue(10000);
    metricsSpy.monthlyExpenses.mockReturnValue(5000);
    metricsSpy.periodFixedCosts.mockReturnValue(2000);
    metricsSpy.periodVariableExpenses.mockReturnValue(3000);
    metricsSpy.netProfit.mockReturnValue(5000);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 400 }));

    TestBed.configureTestingModule({
      providers: [
        GeminiRecommendationsService,
        { provide: FinancialInsightsService, useValue: financialInsightsSpy },
        { provide: DashboardMetricsService, useValue: metricsSpy },
      ],
    });

    service = TestBed.inject(GeminiRecommendationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return local recommendations when API key is not configured', async () => {
    const result = await service.generateRecommendations('Mes');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toBeDefined();
    expect(result[0].actionItems.length).toBeGreaterThan(0);
  });

  it('should generate urgent recommendations for negative profit', async () => {
    metricsSpy.netProfit.mockReturnValue(-1000);
    metricsSpy.monthlySales.mockReturnValue(5000);

    const result = await service.generateRecommendations('Mes');
    expect(result[0].urgency).toBe('alta');
    expect(result[0].title).toContain('urgente');
  });

  it('should generate medium-urgency recommendations for low margin', async () => {
    metricsSpy.netProfit.mockReturnValue(500);
    metricsSpy.monthlySales.mockReturnValue(10000);

    const result = await service.generateRecommendations('Mes');
    expect(result[0].urgency).toBe('media');
  });

  it('should generate low-urgency recommendations for healthy profit', async () => {
    metricsSpy.netProfit.mockReturnValue(3000);
    metricsSpy.monthlySales.mockReturnValue(10000);

    const result = await service.generateRecommendations('Mes');
    expect(result[0].urgency).toBe('baja');
  });

  it('should handle invalid API response gracefully', async () => {
    const result = await service.generateRecommendations('Mes');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].actionItems.length).toBeGreaterThan(0);
  });
});
