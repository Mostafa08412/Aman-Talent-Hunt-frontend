import { Roles } from '../models/enums';

export interface RoleDefinition {
  value: Roles;
  name: string;
  viewName: string;
  description: string;
}

export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  {
    value: Roles.SuperAdmin,
    name: 'SuperAdmin',
    viewName: 'Super Admin',
    description: 'Full system access across all modules and settings.',
  },
  {
    value: Roles.HRManager,
    name: 'HRManager',
    viewName: 'HR Manager',
    description:
      'Full access to recruitment, manpower planning, and position registry.',
  },
  {
    value: Roles.Recruiter,
    name: 'Recruiter',
    viewName: 'Recruiter',
    description:
      'Can manage job postings, view candidates, and process applications.',
  },
  {
    value: Roles.DepartmentHead,
    name: 'DepartmentHead',
    viewName: 'Department Head',
    description:
      'Can view departmental requisitions and approve manpower requests.',
  },
  {
    value: Roles.HiringManager,
    name: 'HiringManager',
    viewName: 'Hiring Manager',
    description:
      'Can interview candidates and submit feedback for specific requisitions.',
  },
] as const;

export const ROLE_BY_VALUE = new Map<RoleDefinition['value'], RoleDefinition>(
  ROLE_DEFINITIONS.map((r) => [r.value, r]),
);

export const ROLE_BY_NAME = new Map<string, RoleDefinition>(
  ROLE_DEFINITIONS.map((r) => [r.name, r]),
);
