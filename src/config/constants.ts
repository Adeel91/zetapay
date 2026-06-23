export const DASHBOARD = '/dashboard';
export const AUTH = '/auth';
export const EMPLOYER = 'employer';
export const AUDITOR = 'auditor';

export const CONTRACTOR = 'contractor';
export const CONSULTANT = 'consultant';
export const FREELANCER = 'freelancer';
export const VENDOR = 'vendor';
export const EMPLOYEE = 'employee';

export const ROUTES = {
  auth: {
    root: AUTH,
    employerConnect: `${AUTH}/${EMPLOYER}/connect`,
    auditorLogin: `${AUTH}/${AUDITOR}/login`,
    auditorSignup: `${AUTH}/${AUDITOR}/signup`,
  },
  employer: {
    root: `${DASHBOARD}/${EMPLOYER}`,
    payroll: `${DASHBOARD}/${EMPLOYER}/payroll`,
    send: `${DASHBOARD}/${EMPLOYER}/payroll/send`,
    payrollDetail: (id: string) => `${DASHBOARD}/${EMPLOYER}/payroll/${id}`,
    employees: `${DASHBOARD}/${EMPLOYER}/employees`,
    addEmployee: `${DASHBOARD}/${EMPLOYER}/employees/add`,
    history: `${DASHBOARD}/${EMPLOYER}/history`,
    settings: `${DASHBOARD}/${EMPLOYER}/settings`,
  },
  auditor: {
    root: `${DASHBOARD}/${AUDITOR}`,
    verify: `${DASHBOARD}/${AUDITOR}/verify`,
    reports: `${DASHBOARD}/${AUDITOR}/reports`,
    history: `${DASHBOARD}/${AUDITOR}/history`,
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
    byEnterprise: (enterpriseId: number) => `/api/employees?enterpriseId=${enterpriseId}`,
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
