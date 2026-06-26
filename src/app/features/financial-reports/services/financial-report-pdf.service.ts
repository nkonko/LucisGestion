import { Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  ExpenseAnomaly,
  PriorityCustomer,
  ProductOpportunity,
} from '../../../core/models/financial-report';
import type { Ingredient } from '../../../core/models/ingredient/ingredient.model';

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

export interface FinancialReportPdfData {
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
}

interface BusinessInfo {
  name: string;
  activity: string;
  description: string;
}

interface HealthStatus {
  label: string;
  color: [number, number, number];
  note: string;
}

@Injectable({ providedIn: 'root' })
export class FinancialReportPdfService {
  private readonly currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  });

  private readonly dateFormatter = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  async exportReport(data: FinancialReportPdfData): Promise<void> {
    return Sentry.startSpan(
      {
        name: 'exportReportPdf',
        op: 'function',
      },
      async () => {
    const business = this.getBusinessInfo();
    const logoDataUrl = await this.createCupcakeMarkDataUrl();
    const conclusions = this.buildConclusions(data);
    const health = this.getHealthStatus(data);

    const detailedPdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const detailContentWidth = detailedPdf.internal.pageSize.getWidth() - 80;
    this.renderCover(detailedPdf, {
      title: 'Reporte financiero - Detalle completo',
      subtitle: 'Analisis para seguimiento operativo',
      business,
      periodLabel: data.periodLabel,
      generatedAt: data.generatedAt,
      logoDataUrl,
    });

    detailedPdf.addPage();
    let currentY = 44;
    currentY = this.renderHealthSection(detailedPdf, health, currentY, 40, detailContentWidth) + 16;
  this.renderSummaryKpis(detailedPdf, data, currentY, 40, detailContentWidth);
    currentY += 168;
  currentY = this.renderConclusions(detailedPdf, conclusions, currentY, 40, detailContentWidth, 6);

    const insightsBody: string[][] = [];
    data.productOpportunities.forEach((insight) => {
      insightsBody.push([
        'Oportunidad producto',
        insight.recipeName,
        `${insight.soldUnits} unidades · ${this.formatCurrency(insight.estimatedRevenue)}`,
      ]);
    });
    data.expenseAnomalies.forEach((insight) => {
      insightsBody.push([
        insight.severity === 'critical' ? 'Costo critico' : 'Costo en alerta',
        insight.title,
        `Actual ${this.formatCurrency(insight.currentAmount)} · Base ${this.formatCurrency(insight.baselineAmount)}`,
      ]);
    });
    data.priorityCustomers.forEach((insight) => {
      insightsBody.push([
        'Cliente prioritario',
        insight.customerName,
        `${this.formatCurrency(insight.billedAmount)} · ${insight.purchasesCount} compras`,
      ]);
    });

    if (insightsBody.length > 0) {
      detailedPdf.setFont('helvetica', 'bold');
      detailedPdf.setFontSize(13);
      detailedPdf.text('Insights y alertas', 40, currentY);
      currentY += 8;

      autoTable(detailedPdf, {
        startY: currentY,
        margin: { left: 40, right: 40 },
        head: [['Tipo', 'Detalle', 'Valor']],
        body: insightsBody,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [32, 43, 57], textColor: 255 },
      });
      currentY = this.getNextY(detailedPdf, currentY);
    }

    if (data.topCustomers.length > 0) {
      detailedPdf.setFont('helvetica', 'bold');
      detailedPdf.setFontSize(13);
      detailedPdf.text('Top clientes', 40, currentY);
      currentY += 8;

      autoTable(detailedPdf, {
        startY: currentY,
        margin: { left: 40, right: 40 },
        head: [['Cliente', 'Facturacion', 'Participacion', 'Pedidos']],
        body: data.topCustomers.map(customer => [
          customer.name,
          this.formatCurrency(customer.revenue),
          `${customer.share}%`,
          `${customer.ordersCount}`,
        ]),
        theme: 'striped',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [32, 43, 57], textColor: 255 },
      });
      currentY = this.getNextY(detailedPdf, currentY);
    }

    if (data.topProducts.length > 0) {
      detailedPdf.setFont('helvetica', 'bold');
      detailedPdf.setFontSize(13);
      detailedPdf.text('Top productos', 40, currentY);
      currentY += 8;

      autoTable(detailedPdf, {
        startY: currentY,
        margin: { left: 40, right: 40 },
        head: [['Producto', 'Unidades', 'Ingresos', 'Margen']],
        body: data.topProducts.map(product => [
          product.name,
          `${product.quantity}`,
          this.formatCurrency(product.revenue),
          `${product.margin}%`,
        ]),
        theme: 'striped',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [32, 43, 57], textColor: 255 },
      });
      currentY = this.getNextY(detailedPdf, currentY);
    }

    if (data.lowStockItems.length > 0) {
      detailedPdf.setFont('helvetica', 'bold');
      detailedPdf.setFontSize(13);
      detailedPdf.text('Alertas de stock', 40, currentY);
      currentY += 8;

      autoTable(detailedPdf, {
        startY: currentY,
        margin: { left: 40, right: 40 },
        head: [['Insumo', 'Stock actual', 'Stock minimo', 'Unidad']],
        body: data.lowStockItems.map(item => [
          item.name,
          `${item.currentStock}`,
          `${item.minimumStock}`,
          item.unit,
        ]),
        theme: 'striped',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [32, 43, 57], textColor: 255 },
      });
    }

    this.renderFooter(detailedPdf, 'Detalle financiero');
    detailedPdf.save(this.buildFileName(data.generatedAt));
    });
  }

  private formatCurrency(amount: number): string {
    return this.currencyFormatter.format(amount);
  }

  private buildFileName(date: Date): string {
    const isoDate = date.toISOString().slice(0, 10);
    return `reporte-financiero-${isoDate}.pdf`;
  }

  private getNextY(documentPdf: jsPDF, fallbackY: number): number {
    const withTables = documentPdf as jsPDF & { lastAutoTable?: { finalY: number } };
    if (!withTables.lastAutoTable) {
      return fallbackY + 12;
    }
    return withTables.lastAutoTable.finalY + 20;
  }

  private getBusinessInfo(): BusinessInfo {
    return {
      name: 'Lucis Gestion',
      activity: 'Pasteleria artesanal',
      description: 'Gestion de costos, stock y ventas',
    };
  }

  private async createCupcakeMarkDataUrl(): Promise<string | null> {
    try {
      if (!globalThis.document) {
        return null;
      }

      const canvas = globalThis.document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      context.fillStyle = '#fbe6d8';
      context.beginPath();
      context.arc(120, 120, 110, 0, Math.PI * 2);
      context.fill();

      context.font = '140px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('🧁', 120, 132);

      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }

  private renderCover(
    documentPdf: jsPDF,
    options: {
      title: string;
      subtitle: string;
      business: BusinessInfo;
      periodLabel: string;
      generatedAt: Date;
      logoDataUrl: string | null;
    },
  ): void {
    const pageWidth = documentPdf.internal.pageSize.getWidth();
    const pageHeight = documentPdf.internal.pageSize.getHeight();

    documentPdf.setFillColor(250, 246, 242);
    documentPdf.rect(0, 0, pageWidth, pageHeight, 'F');
    documentPdf.setFillColor(224, 131, 93);
    documentPdf.rect(0, 0, pageWidth, 12, 'F');

    if (options.logoDataUrl) {
      documentPdf.addImage(options.logoDataUrl, 'PNG', pageWidth / 2 - 32, 82, 64, 64);
    } else {
      documentPdf.setFillColor(61, 73, 84);
      documentPdf.circle(pageWidth / 2, 114, 32, 'F');
      documentPdf.setTextColor(255, 255, 255);
      documentPdf.setFont('helvetica', 'bold');
      documentPdf.setFontSize(20);
      documentPdf.text('🧁', pageWidth / 2, 121, { align: 'center' });
      documentPdf.setTextColor(20, 20, 20);
    }

    documentPdf.setFont('helvetica', 'bold');
    documentPdf.setFontSize(24);
    documentPdf.text(options.business.name, pageWidth / 2, 185, { align: 'center' });

    documentPdf.setFont('helvetica', 'normal');
    documentPdf.setFontSize(12);
    documentPdf.text(options.business.activity, pageWidth / 2, 208, { align: 'center' });
    documentPdf.text(options.business.description, pageWidth / 2, 225, { align: 'center' });

    documentPdf.setFont('helvetica', 'bold');
    documentPdf.setFontSize(18);
    documentPdf.text(options.title, pageWidth / 2, 278, { align: 'center' });

    documentPdf.setFont('helvetica', 'normal');
    documentPdf.setFontSize(12);
    documentPdf.text(options.subtitle, pageWidth / 2, 300, { align: 'center' });

    documentPdf.setDrawColor(213, 218, 226);
    documentPdf.roundedRect(84, 352, pageWidth - 168, 122, 8, 8, 'S');
    documentPdf.setFontSize(11);
    documentPdf.text(`Periodo analizado: ${options.periodLabel}`, 104, 392);
    documentPdf.text(`Fecha de generacion: ${this.dateFormatter.format(options.generatedAt)}`, 104, 416);
    documentPdf.text('Documento para soporte de decisiones financieras.', 104, 440);
  }

  private renderSummaryKpis(documentPdf: jsPDF, data: FinancialReportPdfData, y: number, x: number, width: number): void {
    documentPdf.setFillColor(247, 249, 252);
    documentPdf.roundedRect(x, y, width, 152, 8, 8, 'F');
    const columnWidth = width / 2;

    documentPdf.setDrawColor(228, 232, 238);
    documentPdf.line(x + columnWidth, y + 14, x + columnWidth, y + 138);

    const metricRows = [
      ['Ingresos totales', this.formatCurrency(data.monthlySales)],
      ['Costos variables', `${this.formatCurrency(data.periodVariableExpenses)} (${data.variableCostRate}%)`],
      ['Gastos fijos', `${this.formatCurrency(data.periodFixedCosts)} (${data.fixedCostRate}%)`],
      ['Beneficio neto', `${this.formatCurrency(data.netProfit)} (${data.profitRate}%)`],
    ] as const;

    metricRows.forEach((entry, index) => {
      const rowY = y + 30 + Math.floor(index / 2) * 58;
      const columnX = x + (index % 2) * columnWidth;
      documentPdf.setFont('helvetica', 'bold');
      documentPdf.setFontSize(12);
      documentPdf.text(entry[0], columnX + 16, rowY);
      documentPdf.setFont('helvetica', 'normal');
      documentPdf.setFontSize(20);
      documentPdf.text(entry[1], columnX + 16, rowY + 28);
    });
  }

  private renderConclusions(
    documentPdf: jsPDF,
    conclusions: readonly string[],
    y: number,
    x: number,
    width: number,
    maxItems: number,
  ): number {
    const selected = conclusions.slice(0, maxItems);
    const blockHeight = 40 + selected.length * 22;

    documentPdf.setFillColor(251, 251, 251);
    documentPdf.roundedRect(x, y, width, blockHeight, 8, 8, 'F');
    documentPdf.setFont('helvetica', 'bold');
    documentPdf.setFontSize(13);
    documentPdf.text('Conclusiones automaticas', x + 14, y + 22);

    documentPdf.setFont('helvetica', 'normal');
    documentPdf.setFontSize(10);
    selected.forEach((text, index) => {
      documentPdf.text(`• ${text}`, x + 18, y + 45 + index * 20, { maxWidth: width - 30 });
    });

    return y + blockHeight + 18;
  }

  private renderHealthSection(documentPdf: jsPDF, health: HealthStatus, y: number, x: number, width: number): number {
    const dotX = x + 26;
    const titleY = y + 24;
    const rowY = y + 46;

    documentPdf.setFont('helvetica', 'bold');
    documentPdf.setFontSize(11);
    const labelWidth = documentPdf.getTextWidth(health.label);
    const noteStartX = dotX + 12 + 12 + labelWidth + 14;
    const noteMaxWidth = Math.max(100, x + width - noteStartX - 14);
    const noteLines = documentPdf.splitTextToSize(health.note, noteMaxWidth);
    const noteLineHeight = 12;
    const contentBottomY = rowY + Math.max(0, (noteLines.length - 1) * noteLineHeight);
    const boxHeight = Math.max(70, contentBottomY - y + 20);

    documentPdf.setFillColor(245, 247, 250);
    documentPdf.roundedRect(x, y, width, boxHeight, 8, 8, 'F');

    documentPdf.setFontSize(12);
    documentPdf.text('Semaforo de salud financiera', x + 14, titleY);

    documentPdf.setFillColor(...health.color);
    documentPdf.circle(dotX, rowY - 4, 6, 'F');

    documentPdf.setFont('helvetica', 'bold');
    documentPdf.setFontSize(11);
    documentPdf.text(health.label, dotX + 12, rowY);

    documentPdf.setFont('helvetica', 'normal');
    documentPdf.setFontSize(10);
    documentPdf.text(noteLines, noteStartX, rowY);

    return y + boxHeight;
  }

  private renderFooter(documentPdf: jsPDF, title: string): void {
    const totalPages = documentPdf.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      documentPdf.setPage(pageNumber);
      documentPdf.setFont('helvetica', 'normal');
      documentPdf.setFontSize(9);
      documentPdf.text(
        `${title} · Pagina ${pageNumber} de ${totalPages}`,
        40,
        documentPdf.internal.pageSize.getHeight() - 20,
      );
    }
  }

  private buildConclusions(data: FinancialReportPdfData): string[] {
    const conclusions: string[] = [];

    if (data.netProfit < 0) {
      conclusions.push('El periodo cierra con perdida neta. Priorizar ajuste de costos fijos y variables.');
    } else {
      conclusions.push('El periodo cierra con rentabilidad positiva. Se recomienda sostener el mix actual.');
    }

    if (data.fixedCostRate >= 45) {
      conclusions.push('Los gastos fijos superan el umbral recomendado del 45% sobre ingresos.');
    }

    if (data.variableCostRate >= 55) {
      conclusions.push('El costo variable esta elevado. Revisar precios de insumos y rendimiento por receta.');
    }

    if (data.topProducts.length > 0) {
      const topProduct = data.topProducts[0];
      conclusions.push(`El producto lider es ${topProduct.name} con ${topProduct.quantity} unidades vendidas.`);
    }

    if (data.lowStockItems.length > 0) {
      conclusions.push(`Hay ${data.lowStockItems.length} insumos bajo minimo. Conviene reponer en el corto plazo.`);
    }

    if (data.expenseAnomalies.some(item => item.severity === 'critical')) {
      conclusions.push('Se detectaron alertas criticas de gastos. Validar desvíos antes del cierre contable.');
    }

    if (conclusions.length < 3) {
      conclusions.push('Continuar monitoreo semanal para sostener estabilidad operativa y de caja.');
    }

    return conclusions;
  }

  private getHealthStatus(data: FinancialReportPdfData): HealthStatus {
    if (data.netProfit < 0 || data.profitRate < 5) {
      return {
        label: 'Rojo - Riesgo alto',
        color: [212, 76, 71],
        note: 'Margen insuficiente o negativo. Requiere acciones correctivas inmediatas.',
      };
    }

    if (data.fixedCostRate >= 40 || data.variableCostRate >= 50 || data.profitRate < 15) {
      return {
        label: 'Amarillo - En observacion',
        color: [224, 161, 52],
        note: 'Situacion estable con desvíos moderados. Mantener seguimiento de costos.',
      };
    }

    return {
      label: 'Verde - Saludable',
      color: [68, 158, 93],
      note: 'Rentabilidad y estructura de costos dentro de parametros recomendados.',
    };
  }
}
