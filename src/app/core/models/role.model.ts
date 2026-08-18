
export enum Role {
  Candidate = 'Candidate',
  Recruiter = 'Recruiter',
  HiringManager = 'HiringManager',
  DepartmentHead = 'DepartmentHead',
  FinanceApprover = 'FinanceApprover',
  HRManager = 'HRManager',
  OnboardingCoordinator = 'OnboardingCoordinator',
  Admin = 'Admin',
  SuperAdmin = 'SUPER_ADMIN',
}

export const INTERNAL_ROLES: Role[] = [
  Role.Recruiter,
  Role.HiringManager,
  Role.DepartmentHead,
  Role.FinanceApprover,
  Role.HRManager,
  Role.OnboardingCoordinator,
  Role.Admin,
  Role.SuperAdmin,
];

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  department?: string;
}
