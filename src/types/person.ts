export type PersonType = 'employee' | 'freelancer' | 'contractor' | 'vendor' | 'consultant';

export interface Person {
  id: string;
  name: string;
  wallet: string;
  email: string;
  type: PersonType;
  verified: boolean;
  createdAt: string;
  company?: string;
  project?: string;
  department?: string;
  position?: string;
}

export const TYPE_COLORS: Record<PersonType, string> = {
  employee: 'bg-emerald-50 text-emerald-600',
  freelancer: 'bg-indigo-50 text-indigo-600',
  contractor: 'bg-orange-50 text-orange-600',
  vendor: 'bg-purple-50 text-purple-600',
  consultant: 'bg-pink-50 text-pink-600',
};

export const TYPE_LABELS: Record<PersonType, string> = {
  employee: 'Employee',
  freelancer: 'Freelancer',
  contractor: 'Contractor',
  vendor: 'Vendor',
  consultant: 'Consultant',
};
