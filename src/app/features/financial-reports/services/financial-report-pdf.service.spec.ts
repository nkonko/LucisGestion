import { TestBed } from '@angular/core/testing';
import { FinancialReportPdfService, FinancialReportPdfData } from './financial-report-pdf.service';

describe('FinancialReportPdfService', () => {
  let service: FinancialReportPdfService;

  const mockData: FinancialReportPdfData = {
    periodLabel: 'Junio 2026',
    generatedAt: new Date('2026-06-15'),
    monthlySales: 100000,
    periodVariableExpenses: 30000,
    periodFixedCosts: 20000,
    netProfit: 50000,
    variableCostRate: 30,
    fixedCostRate: 20,
    profitRate: 50,
    productOpportunities: [],
    expenseAnomalies: [],
    priorityCustomers: [],
    topCustomers: [],
    topProducts: [],
    lowStockItems: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FinancialReportPdfService],
    });
    service = TestBed.inject(FinancialReportPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export report without errors', async () => {
    await service.exportReport(mockData);
  });

  it('should handle export with top customers', async () => {
    const dataWithCustomers: FinancialReportPdfData = {
      ...mockData,
      topCustomers: [
        { name: 'Customer A', revenue: 50000, share: 50, ordersCount: 10 },
        { name: 'Customer B', revenue: 30000, share: 30, ordersCount: 8 },
      ],
    };
    await service.exportReport(dataWithCustomers);
  });

  it('should handle export with product opportunities', async () => {
    const dataWithOpportunities: FinancialReportPdfData = {
      ...mockData,
      productOpportunities: [
        {
          id: '1',
          type: 'product-opportunity',
          severity: 'info',
          title: 'Product A Opportunity',
          description: 'Opportunity description',
          impact: 'High impact',
          recommendation: 'Increase production',
          recipeId: 'recipe-1',
          recipeName: 'Product A',
          soldUnits: 100,
          estimatedRevenue: 5000,
        },
      ],
    };
    await service.exportReport(dataWithOpportunities);
  });

  it('should handle export with expense anomalies', async () => {
    const dataWithAnomalies: FinancialReportPdfData = {
      ...mockData,
      expenseAnomalies: [
        {
          id: '1',
          type: 'expense-anomaly',
          severity: 'warning',
          title: 'Utilities Anomaly',
          description: 'Anomaly description',
          impact: 'Cost increase',
          recommendation: 'Investigate and reduce',
          category: 'utilities',
          currentAmount: 5000,
          baselineAmount: 3000,
          increaseRatio: 1.67,
        },
      ],
    };
    await service.exportReport(dataWithAnomalies);
  });

  it('should handle export with low stock items', async () => {
    const dataWithLowStock: FinancialReportPdfData = {
      ...mockData,
      lowStockItems: [
        {
          id: '1',
          name: 'Ingredient A',
          unit: 'kg' as const,
          unitPrice: 100,
          currentStock: 5,
          minimumStock: 10,
          category: 'dry' as const,
          lastPurchase: null,
          active: true,
        },
      ],
    };
    await service.exportReport(dataWithLowStock);
  });
});
