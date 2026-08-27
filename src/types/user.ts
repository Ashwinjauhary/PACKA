// User and authentication types

export type UserRole = 'officer' | 'supervisor' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  state: string;
  district: string;
}

export const DEMO_USERS: User[] = [
  {
    id: 'officer-001',
    name: 'Rajesh Kumar',
    role: 'officer',
    email: 'rajesh.kumar@legalmetrology.gov.in',
    department: 'Legal Metrology',
    state: 'Maharashtra',
    district: 'Mumbai',
  },
  {
    id: 'supervisor-001',
    name: 'Priya Sharma',
    role: 'supervisor',
    email: 'priya.sharma@legalmetrology.gov.in',
    department: 'Legal Metrology',
    state: 'Maharashtra',
    district: '',
  },
  {
    id: 'admin-001',
    name: 'Amit Verma',
    role: 'admin',
    email: 'amit.verma@doca.gov.in',
    department: 'DoCA',
    state: '',
    district: '',
  },
];
