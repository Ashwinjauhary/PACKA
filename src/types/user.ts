// User and authentication types

export type UserRole = 'officer' | 'supervisor' | 'admin' | 'manufacturer' | 'ecommerce';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  state: string;
  district: string;
}

