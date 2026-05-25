import { ExportDatasetKey } from './export-dataset-key.model';

export interface FinancialExportRequest {
  datasets: ExportDatasetKey[];
  period: Date;
}
