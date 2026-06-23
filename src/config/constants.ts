export const DASHBOARD = '/dashboard';
export const ROLE = '/role';

export const ROUTES = {
  employer: {
    root: `${DASHBOARD}/employer`,
    payroll: `${DASHBOARD}/employer/payroll`,
    send: `${DASHBOARD}/employer/payroll/send`,
    payrollDetail: (id: string) => `${DASHBOARD}/employer/payroll/${id}`,
    employees: `${DASHBOARD}/employer/employees`,
    addEmployee: `${DASHBOARD}/employer/employees/add`,
    history: `${DASHBOARD}/employer/history`,
    settings: `${DASHBOARD}/employer/settings`,
  },
  auditor: {
    root: `${DASHBOARD}/auditor`,
    verify: `${DASHBOARD}/auditor/verify`,
    reports: `${DASHBOARD}/auditor/reports`,
    history: `${DASHBOARD}/auditor/history`,
  },
} as const;

export const API = {
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  payroll: {
    root: '/api/payroll',
    detail: (id: string) => `/api/payroll/${id}`,
    execute: '/api/payroll/execute',
  },
  employees: {
    root: '/api/employees',
    detail: (id: string) => `/api/employees/${id}`,
  },
  audit: {
    verify: '/api/audit/verify',
    decrypt: '/api/audit/decrypt',
    reports: '/api/audit/reports',
  },
  stellar: {
    send: '/api/stellar/send',
    balance: '/api/stellar/balance',
  },
  zk: {
    generate: '/api/zk/generate',
    verify: '/api/zk/verify',
  },
} as const;
