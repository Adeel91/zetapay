export type PayrollStatus = 'Completed' | 'Pending' | 'Failed' | 'Processing';

export interface PayrollHistoryItem {
  id: string;
  date: string;
  employees: number;
  total: string;
  status: PayrollStatus;
}
