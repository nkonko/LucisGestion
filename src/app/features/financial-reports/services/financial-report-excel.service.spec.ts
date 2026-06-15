import { TestBed } from '@angular/core/testing';
import { FinancialReportExcelService, FinancialReportExcelData } from './financial-report-excel.service';

describe('FinancialReportExcelService', () => {
  let service: FinancialReportExcelService;

  const mockData: FinancialReportExcelData = {
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
      providers: [FinancialReportExcelService],
    });
    service = TestBed.inject(FinancialReportExcelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export report without errors', async () => {
    const result = await service.exportReport(mockData);
    expect(result).toBeUndefined();
  });

  it('should handle export with top customers', async () => {
    const dataWithCustomers: FinancialReportExcelData = {
      ...mockData,
      topCustomers: [
        { name: 'Customer A', revenue: 50000, share: 50, ordersCount: 10 },
        { name: 'Customer B', revenue: 30000, share: 30, ordersCount: 8 },
      ],
    };
    const result = await service.exportReport(dataWithCustomers);
    expect(result).toBeUndefined();
  });

  it('should handle export with top products', async () => {
    const dataWithProducts: FinancialReportExcelData = {
      ...mockData,
      topProducts: [
        { name: 'Product A', quantity: 100, revenue: 50000, margin: 20 },
        { name: 'Product B', quantity: 80, revenue: 30000, margin: 25 },
      ],
    };
    const result = await service.exportReport(dataWithProducts);
    expect(result).toBeUndefined();
  });

  it('should handle export with opportunities and anomalies', async () => {
    const dataWithInsights: FinancialReportExcelData = {
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
    const result = await service.exportReport(dataWithInsights);
    expect(result).toBeUndefined();
  });
});
