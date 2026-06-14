import { FixedCostEntry } from "./fixed-cost-month.model";

export interface FixedCostFormData {
  monthLabel: string;
  entry: FixedCostEntry | null;
}