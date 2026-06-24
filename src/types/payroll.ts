export type PayrollStatus = 'Completed' | 'Pending' | 'Failed' | 'Processing';

export interface PayrollHistoryItem {
  id: string;
  date: string;
  employees: number;
  total: string;
  status: PayrollStatus;
}

export interface PayrollRunDetail {
  id: number;
  payrollRunId: number;
  grossSalary: string;
  netSalary: string;
  taxWithheld: string;
  status: string;
  processedAt: string;
  txHash: string;
  payrollRun: {
    runDate: string;
    periodStart: string;
    periodEnd: string;
    status: string;
    totalGross: string;
    totalNet: string;
    totalTaxWithheld: string;
  };
  employee: {
    id: string;
    fullName: string;
    email: string;
    walletAddress: string;
    type: string;
  };
}
