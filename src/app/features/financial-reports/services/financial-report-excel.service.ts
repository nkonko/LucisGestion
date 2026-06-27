import { Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';
import ExcelJS from 'exceljs';
import type {
  ExpenseAnomaly,
  PriorityCustomer,
  ProductOpportunity,
} from '../../../core/models/financial-report';
import type { Ingredient } from '../../../core/models/ingredient/ingredient.model';
import type { DetailedTransactionRow } from '../utils/build-detailed-transactions';

interface TopCustomerRow {
  name: string;
  revenue: number;
  share: number;
  ordersCount: number;
}

interface TopProductRow {
  name: string;
  quantity: number;
  revenue: number;
  margin: number;
}

interface HealthStyle {
  label: string;
  emoji: string;
  fillColor: string;
}

export interface FinancialReportExcelData {
  periodLabel: string;
  generatedAt: Date;
  monthlySales: number;
  periodVariableExpenses: number;
  periodFixedCosts: number;
  netProfit: number;
  variableCostRate: number;
  fixedCostRate: number;
  profitRate: number;
  productOpportunities: readonly ProductOpportunity[];
  expenseAnomalies: readonly ExpenseAnomaly[];
  priorityCustomers: readonly PriorityCustomer[];
  topCustomers: readonly TopCustomerRow[];
  topProducts: readonly TopProductRow[];
  lowStockItems: readonly Ingredient[];
  detailedTransactions: readonly DetailedTransactionRow[];
}

@Injectable({ providedIn: 'root' })
export class FinancialReportExcelService {
  private readonly currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  });

  private readonly dateFormatter = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  async exportReport(data: FinancialReportExcelData): Promise<void> {
    return Sentry.startSpan(
      {
        name: 'exportReportExcel',
        op: 'function',
      },
      async () => {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Lucis Gestion';
        workbook.lastModifiedBy = 'Lucis Gestion';
        workbook.created = new Date();
        workbook.modified = new Date();

        this.addSummarySheet(workbook, data);
        this.addInsightsSheet(workbook, data);
        this.addTopCustomersSheet(workbook, data);
        this.addTopProductsSheet(workbook, data);
        this.addLowStockSheet(workbook, data);
        this.addDetailedSheet(workbook, data);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        this.downloadFile(blob, this.buildFileName(data.generatedAt));
      },
    );
  }

  private addSummarySheet(workbook: ExcelJS.Workbook, data: FinancialReportExcelData): void {
    const health = this.getHealthStyle(data);
    const sheet = workbook.addWorksheet('Resumen', {
      views: [{ state: 'frozen', ySplit: 7 }],
    });

    sheet.columns = [
      { key: 'label', width: 42 },
      { key: 'value', width: 34 },
    ];

    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Reporte financiero';
    titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF23374D' } };
    titleCell.alignment = { vertical: 'middle' };

    sheet.addRow(['Periodo', data.periodLabel]);
    sheet.addRow(['Generado', this.dateFormatter.format(data.generatedAt)]);
    sheet.addRow(['Semaforo financiero', `${health.emoji} ${health.label}`]);
    sheet.addRow([]);
    sheet.addRow(['Indicador', 'Valor']);

    sheet.addRow(['Ingresos totales', data.monthlySales]);
    sheet.addRow(['Costos variables', data.periodVariableExpenses]);
    sheet.addRow(['Gastos fijos', data.periodFixedCosts]);
    sheet.addRow(['Beneficio neto', data.netProfit]);
    sheet.addRow([]);
    sheet.addRow(['Conclusiones automaticas', '']);
    for (const conclusion of this.buildConclusions(data)) {
      sheet.addRow([conclusion, '']);
    }

    this.styleHeaderRow(sheet.getRow(6), 'FF2B4C7E');
    this.styleSheetFrame(sheet, 2, 4, 2);
    this.styleSheetFrame(sheet, 7, 9, 2);
    for (const cellAddress of ['A6', 'B6']) {
      const cell = sheet.getCell(cellAddress);
      cell.font = {
        ...(cell.font ?? { name: 'Calibri', size: 11 }),
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
    }

    const healthLabelCell = sheet.getCell('A4');
    const healthValueCell = sheet.getCell('B4');
    healthLabelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: health.fillColor },
    };
    healthValueCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: health.fillColor },
    };
    const healthTextColor = this.getContrastTextColor(health.fillColor);
    healthLabelCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: healthTextColor } };
    healthValueCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: healthTextColor } };

    sheet.getCell('A12').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF23374D' } };

    for (let rowIndex = 7; rowIndex <= 10; rowIndex += 1) {
      const valueCell = sheet.getCell(`B${rowIndex}`);
      valueCell.numFmt = '$ #,##0.00';
      valueCell.font = { name: 'Calibri', size: 11, color: { argb: 'FF1D2733' } };
      if (rowIndex % 2 === 0) {
        this.fillRow(sheet.getRow(rowIndex), 'FFF7FAFC');
      }
    }

    for (let rowIndex = 13; rowIndex <= sheet.rowCount; rowIndex += 1) {
      const cell = sheet.getCell(`A${rowIndex}`);
      cell.alignment = { wrapText: true, vertical: 'top' };
      if (rowIndex % 2 !== 0) {
        this.fillRow(sheet.getRow(rowIndex), 'FFFCFDFE');
      }
    }
  }

  private addInsightsSheet(workbook: ExcelJS.Workbook, data: FinancialReportExcelData): void {
    const sheet = workbook.addWorksheet('Insights', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { key: 'type', width: 24 },
      { key: 'detail', width: 40 },
      { key: 'value', width: 40 },
    ];

    sheet.addRow(['Tipo', 'Detalle', 'Valor']);
    this.styleHeaderRow(sheet.getRow(1), 'FF355C7D');

    data.productOpportunities.forEach((item) => {
      sheet.addRow([
        'Oportunidad producto',
        item.recipeName,
        `${item.soldUnits} unidades - ${this.formatCurrency(item.estimatedRevenue)}`,
      ]);
    });

    data.expenseAnomalies.forEach((item) => {
      const level = item.severity === 'critical' ? 'Costo critico' : 'Costo en alerta';
      sheet.addRow([
        level,
        item.title,
        `Actual ${this.formatCurrency(item.currentAmount)} - Base ${this.formatCurrency(item.baselineAmount)}`,
      ]);
    });

    data.priorityCustomers.forEach((item) => {
      sheet.addRow([
        'Cliente prioritario',
        item.customerName,
        `${this.formatCurrency(item.billedAmount)} - ${item.purchasesCount} compras`,
      ]);
    });

    if (sheet.rowCount === 1) {
      sheet.addRow(['Sin datos', '', '']);
    }

    this.styleTableSheet(sheet, 1, 'FFF8FBFF');
    sheet.autoFilter = { from: 'A1', to: 'C1' };
  }

  private addTopCustomersSheet(workbook: ExcelJS.Workbook, data: FinancialReportExcelData): void {
    const sheet = workbook.addWorksheet('Top clientes', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { key: 'name', width: 32 },
      { key: 'revenue', width: 18 },
      { key: 'share', width: 16 },
      { key: 'orders', width: 12 },
    ];

    sheet.addRow(['Cliente', 'Facturacion', 'Participacion', 'Pedidos']);
    this.styleHeaderRow(sheet.getRow(1), 'FF28536B');

    data.topCustomers.forEach((item) => {
      sheet.addRow([item.name, item.revenue, item.share / 100, item.ordersCount]);
    });

    if (sheet.rowCount === 1) {
      sheet.addRow(['Sin datos', '', '', '']);
    }

    for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex += 1) {
      sheet.getCell(`B${rowIndex}`).numFmt = '$ #,##0.00';
      sheet.getCell(`C${rowIndex}`).numFmt = '0.00%';
    }

    this.styleTableSheet(sheet, 1, 'FFF4FAF8');
    sheet.autoFilter = { from: 'A1', to: 'D1' };
  }

  private addTopProductsSheet(workbook: ExcelJS.Workbook, data: FinancialReportExcelData): void {
    const sheet = workbook.addWorksheet('Top productos', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { key: 'name', width: 34 },
      { key: 'units', width: 12 },
      { key: 'revenue', width: 18 },
      { key: 'margin', width: 14 },
    ];

    sheet.addRow(['Producto', 'Unidades', 'Ingresos', 'Margen']);
    this.styleHeaderRow(sheet.getRow(1), 'FF1B4965');

    data.topProducts.forEach((item) => {
      sheet.addRow([item.name, item.quantity, item.revenue, item.margin / 100]);
    });

    if (sheet.rowCount === 1) {
      sheet.addRow(['Sin datos', '', '', '']);
    }

    for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex += 1) {
      sheet.getCell(`C${rowIndex}`).numFmt = '$ #,##0.00';
      sheet.getCell(`D${rowIndex}`).numFmt = '0.00%';
    }

    this.styleTableSheet(sheet, 1, 'FFF6F8FD');
    sheet.autoFilter = { from: 'A1', to: 'D1' };
  }

  private addLowStockSheet(workbook: ExcelJS.Workbook, data: FinancialReportExcelData): void {
    const sheet = workbook.addWorksheet('Stock bajo', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { key: 'name', width: 34 },
      { key: 'current', width: 14 },
      { key: 'minimum', width: 14 },
      { key: 'unit', width: 12 },
    ];

    sheet.addRow(['Insumo', 'Stock actual', 'Stock minimo', 'Unidad']);
    this.styleHeaderRow(sheet.getRow(1), 'FF5A3E36');

    data.lowStockItems.forEach((item) => {
      sheet.addRow([item.name, item.currentStock, item.minimumStock, item.unit]);
    });

    if (sheet.rowCount === 1) {
      sheet.addRow(['Sin datos', '', '', '']);
    }

    this.styleTableSheet(sheet, 1, 'FFFFF7F3');
    sheet.autoFilter = { from: 'A1', to: 'D1' };
  }

  private addDetailedSheet(workbook: ExcelJS.Workbook, data: FinancialReportExcelData): void {
    const sheet = workbook.addWorksheet('Detalle', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { key: 'date', width: 16 },
      { key: 'detail', width: 50 },
      { key: 'income', width: 18 },
      { key: 'expense', width: 18 },
    ];

    sheet.addRow(['Fecha', 'Detalle', 'Ingreso', 'Egreso']);
    this.styleHeaderRow(sheet.getRow(1), 'FF2E5C6E');

    for (const tx of data.detailedTransactions) {
      sheet.addRow([tx.date, tx.detail, tx.income, tx.expense]);
    }

    if (sheet.rowCount === 1) {
      sheet.addRow(['Sin datos', '', '', '']);
    }

    for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex += 1) {
      sheet.getCell(`A${rowIndex}`).numFmt = 'dd/mm/yyyy';
      sheet.getCell(`C${rowIndex}`).numFmt = '$ #,##0.00';
      sheet.getCell(`D${rowIndex}`).numFmt = '$ #,##0.00';
    }

    this.styleTableSheet(sheet, 1, 'FFF4F9FB');
    sheet.autoFilter = { from: 'A1', to: 'D1' };
  }

  private styleHeaderRow(row: ExcelJS.Row, backgroundColor: string): void {
    const headerTextColor = this.getContrastTextColor(backgroundColor);
    row.height = 24;
    row.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: headerTextColor },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: backgroundColor },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9E2EC' } },
        left: { style: 'thin', color: { argb: 'FFD9E2EC' } },
        bottom: { style: 'thin', color: { argb: 'FFD9E2EC' } },
        right: { style: 'thin', color: { argb: 'FFD9E2EC' } },
      };
    });
  }

  private getHealthStyle(data: FinancialReportExcelData): HealthStyle {
    if (data.netProfit < 0 || data.profitRate < 5) {
      return {
        label: 'Rojo - Riesgo alto',
        emoji: '🔴',
        fillColor: 'FFFFE3E3',
      };
    }

    if (data.fixedCostRate >= 40 || data.variableCostRate >= 50 || data.profitRate < 15) {
      return {
        label: 'Amarillo - En observacion',
        emoji: '🟡',
        fillColor: 'FFFFF4CC',
      };
    }

    return {
      label: 'Verde - Saludable',
      emoji: '🟢',
      fillColor: 'FFE6F4EA',
    };
  }

  private styleTableSheet(sheet: ExcelJS.Worksheet, headerRowIndex: number, zebraColor: string): void {
    for (let rowIndex = headerRowIndex + 1; rowIndex <= sheet.rowCount; rowIndex += 1) {
      const row = sheet.getRow(rowIndex);
      row.height = 22;
      row.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF1D2733' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE6EEF5' } },
          left: { style: 'thin', color: { argb: 'FFE6EEF5' } },
          bottom: { style: 'thin', color: { argb: 'FFE6EEF5' } },
          right: { style: 'thin', color: { argb: 'FFE6EEF5' } },
        };
      });

      if (rowIndex % 2 === 0) {
        this.fillRow(row, zebraColor);
      }
    }
  }

  private fillRow(row: ExcelJS.Row, fillColor: string): void {
    const textColor = this.getContrastTextColor(fillColor);
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColor },
      };
      cell.font = {
        ...(cell.font ?? { name: 'Calibri', size: 11 }),
        color: { argb: textColor },
      };
    });
  }

  private getContrastTextColor(argbColor: string): string {
    const rgbHex = argbColor.length === 8 ? argbColor.slice(2) : argbColor;
    const red = Number.parseInt(rgbHex.slice(0, 2), 16);
    const green = Number.parseInt(rgbHex.slice(2, 4), 16);
    const blue = Number.parseInt(rgbHex.slice(4, 6), 16);
    const relativeLuminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

    return relativeLuminance < 0.6 ? 'FFFFFFFF' : 'FF1D2733';
  }

  private styleSheetFrame(sheet: ExcelJS.Worksheet, fromRow: number, toRow: number, columnCount: number): void {
    for (let rowIndex = fromRow; rowIndex <= toRow; rowIndex += 1) {
      for (let colIndex = 1; colIndex <= columnCount; colIndex += 1) {
        const cell = sheet.getCell(rowIndex, colIndex);
        cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF1D2733' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE6EEF5' } },
          left: { style: 'thin', color: { argb: 'FFE6EEF5' } },
          bottom: { style: 'thin', color: { argb: 'FFE6EEF5' } },
          right: { style: 'thin', color: { argb: 'FFE6EEF5' } },
        };
      }
    }
  }

  private downloadFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private buildConclusions(data: FinancialReportExcelData): string[] {
    const conclusions: string[] = [];

    if (data.netProfit < 0) {
      conclusions.push('El periodo cierra con perdida neta. Ajustar costos fijos y variables.');
    } else {
      conclusions.push('El periodo cierra con rentabilidad positiva. Mantener el mix de ventas actual.');
    }

    if (data.fixedCostRate >= 45) {
      conclusions.push('Los gastos fijos superan el 45% de los ingresos.');
    }

    if (data.variableCostRate >= 55) {
      conclusions.push('El costo variable esta elevado. Revisar insumos y rendimiento por receta.');
    }

    if (data.topProducts.length > 0) {
      const leadProduct = data.topProducts[0];
      conclusions.push(`Producto lider: ${leadProduct.name} (${leadProduct.quantity} unidades).`);
    }

    if (data.lowStockItems.length > 0) {
      conclusions.push(`Hay ${data.lowStockItems.length} insumos bajo minimo.`);
    }

    if (conclusions.length < 3) {
      conclusions.push('Sostener monitoreo semanal para mantener estabilidad financiera.');
    }

    return conclusions;
  }

  private formatCurrency(amount: number): string {
    return this.currencyFormatter.format(amount);
  }

  private buildFileName(date: Date): string {
    const isoDate = date.toISOString().slice(0, 10);
    return `reporte-financiero-${isoDate}.xlsx`;
  }
}
