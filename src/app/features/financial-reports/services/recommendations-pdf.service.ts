import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { GeminiRecommendation } from '../../../core/services/gemini-recommendations.service';

@Injectable({ providedIn: 'root' })
export class RecommendationsPdfService {
  private readonly dateFormatter = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  exportRecommendations(recommendations: readonly GeminiRecommendation[], periodLabel: string): void {
    if (recommendations.length === 0) {
      return;
    }

    const documentPdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const createdAt = new Date();
    const localCount = recommendations.filter((recommendation) => recommendation.isLocal).length;
    const logoDataUrl = this.createCupcakeMarkDataUrl();

    this.renderCover(documentPdf, periodLabel, createdAt, recommendations.length, localCount, logoDataUrl);
    documentPdf.addPage();
    this.renderContentHeader(documentPdf, periodLabel, recommendations.length);

    let y = 112;
    recommendations.forEach((recommendation, index) => {
      y = this.renderRecommendation(documentPdf, recommendation, index + 1, y);
      if (index < recommendations.length - 1) {
        y += 18;
      }
    });

    documentPdf.save(this.buildFileName(createdAt));
  }

  private renderCover(
    documentPdf: jsPDF,
    periodLabel: string,
    generatedAt: Date,
    total: number,
    localCount: number,
    logoDataUrl: string | null,
  ): void {
    const pageWidth = documentPdf.internal.pageSize.getWidth();
    const pageHeight = documentPdf.internal.pageSize.getHeight();

    documentPdf.setFillColor(248, 245, 241);
    documentPdf.rect(0, 0, pageWidth, pageHeight, 'F');
    documentPdf.setFillColor(212, 117, 86);
    documentPdf.rect(0, 0, pageWidth, 16, 'F');

    documentPdf.setFillColor(61, 73, 84);
    documentPdf.circle(pageWidth / 2, 120, 36, 'F');
    if (logoDataUrl) {
      documentPdf.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 20, 100, 40, 40);
    } else {
      documentPdf.setTextColor(255, 255, 255);
      documentPdf.setFont('helvetica', 'bold');
      documentPdf.setFontSize(10);
      documentPdf.text('Lucis Gestion', pageWidth / 2, 124, { align: 'center' });
    }
    documentPdf.setTextColor(24, 24, 24);

    documentPdf.setFont('helvetica', 'bold');
    documentPdf.setFontSize(13);
    documentPdf.text('Lucis Gestion', pageWidth / 2, 170, { align: 'center' });

    documentPdf.setFont('helvetica', 'bold');
    documentPdf.setFontSize(24);
    documentPdf.text('Recomendaciones Financieras', pageWidth / 2, 200, { align: 'center' });

    documentPdf.setFont('helvetica', 'normal');
    documentPdf.setFontSize(13);
    documentPdf.text('Informe generado por asistente IA con foco operativo', pageWidth / 2, 226, {
      align: 'center',
    });

    documentPdf.setDrawColor(212, 117, 86);
    documentPdf.roundedRect(76, 286, pageWidth - 152, 192, 10, 10, 'S');

    documentPdf.setFontSize(12);
    documentPdf.text(`Periodo analizado: ${periodLabel}`, 102, 330);
    documentPdf.text(`Generado: ${this.dateFormatter.format(generatedAt)}`, 102, 356);
    documentPdf.text(`Total de recomendaciones: ${total}`, 102, 382);
    documentPdf.text(`Recomendaciones locales (fallback): ${localCount}`, 102, 408);
    documentPdf.text('Usar como guia inicial. Validar siempre con criterio del negocio.', 102, 444);

    documentPdf.setFont('helvetica', 'normal');
    documentPdf.setFontSize(10);
    documentPdf.setTextColor(90, 90, 90);
    documentPdf.text('Lucis Gestion', pageWidth / 2, pageHeight - 36, { align: 'center' });
    documentPdf.setTextColor(24, 24, 24);
  }

  private createCupcakeMarkDataUrl(): string | null {
    try {
      const canvas = globalThis.document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      context.font = '96px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('🧁', 80, 92);

      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }

  private renderContentHeader(documentPdf: jsPDF, periodLabel: string, total: number): void {
    documentPdf.setFont('helvetica', 'bold');
    documentPdf.setFontSize(18);
    documentPdf.text('Detalle de recomendaciones', 40, 52);

    documentPdf.setFont('helvetica', 'normal');
    documentPdf.setFontSize(11);
    documentPdf.text(`Periodo: ${periodLabel}`, 40, 74);
    documentPdf.text(`Cantidad: ${total}`, 40, 90);

    documentPdf.setDrawColor(226, 226, 226);
    documentPdf.line(40, 98, 555, 98);
  }

  private renderRecommendation(
    documentPdf: jsPDF,
    recommendation: GeminiRecommendation,
    index: number,
    startY: number,
  ): number {
    const pageHeight = documentPdf.internal.pageSize.getHeight();
    const blockMinHeight = 150;
    let y = startY;

    if (y + blockMinHeight > pageHeight - 40) {
      documentPdf.addPage();
      y = 48;
    }

    documentPdf.setFont('helvetica', 'bold');
    documentPdf.setFontSize(13);
    documentPdf.text(`${index}. ${recommendation.title}`, 40, y);
    y += 18;

    documentPdf.setFont('helvetica', 'normal');
    documentPdf.setFontSize(11);
    const urgencyLabel = this.toUrgencyLabel(recommendation.urgency);
    documentPdf.text(`Urgencia: ${urgencyLabel}`, 40, y);
    y += 16;

    const descriptionLines = documentPdf.splitTextToSize(recommendation.description, 510);
    documentPdf.text(descriptionLines, 40, y);
    y += descriptionLines.length * 14 + 10;

    documentPdf.setFont('helvetica', 'bold');
    documentPdf.text('Acciones recomendadas:', 40, y);
    y += 16;

    documentPdf.setFont('helvetica', 'normal');
    recommendation.actionItems.forEach((action) => {
      const actionLines = documentPdf.splitTextToSize(`• ${action}`, 500);
      if (y + actionLines.length * 14 > pageHeight - 40) {
        documentPdf.addPage();
        y = 48;
      }
      documentPdf.text(actionLines, 50, y);
      y += actionLines.length * 14 + 2;
    });

    return y;
  }

  private toUrgencyLabel(urgency: GeminiRecommendation['urgency']): string {
    if (urgency === 'alta') {
      return 'Urgente';
    }
    if (urgency === 'baja') {
      return 'Optimización';
    }
    return 'Importante';
  }

  private buildFileName(date: Date): string {
    return `recomendaciones-financieras-${date.toISOString().slice(0, 10)}.pdf`;
  }
}