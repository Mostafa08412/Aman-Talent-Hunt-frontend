import { Role } from './role.model';

/* ── ADM-01  User Accounts & RBAC ── */

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  roles: Role[];
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  roles: Role[];
  departmentId?: string;
}

/* ── ADM-02  Squads & Department Mapping ── */

export interface SquadMember {
  id: string;
  fullName: string;
  role: string;
  isLeader: boolean;
}

export interface Squad {
  id: string;
  name: string;
  departments: string[];
  members: SquadMember[];
}

export interface CreateSquadRequest {
  name: string;
  departments: string[];
  memberIds: string[];
  leaderId: string;
}

/* ── ADM-03  Position Registry Catalogue ── */

export type PositionStatus = 'Active' | 'Draft';

export interface Position {
  id: string;
  code: string;
  title: string;
  department: string;
  approved: number;
  filled: number;
  vacant: number;
  status: PositionStatus;
}

export interface CreatePositionRequest {
  code: string;
  title: string;
  departmentId: string;
  approved: number;
  status: PositionStatus;
}

/* ── Shared ── */

export interface Department {
  id: string;
  name: string;
}
