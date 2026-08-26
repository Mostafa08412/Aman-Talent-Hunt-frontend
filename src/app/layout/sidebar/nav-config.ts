import { Role } from '../../core/models/role.model';

export interface NavItem {
  label: string;
  icon: string; // PrimeIcons class, e.g. 'pi pi-home'
  route: string;
  exact?: boolean; // true = active class only on exact route match (default: prefix match)
  roles?: Role[]; // omit = visible to every internal role
  badge?: 'pendingApprovals'; // hook for live counts, see header.component.ts pattern
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_CONFIG: NavGroup[] = [
  {
    label: '',
    items: [
      { label: 'Dashboard', icon: 'pi pi-home', route: '/console', exact: true },
      {
        label: 'HM Workstation',
        icon: 'pi pi-briefcase',
        route: '/hm/dashboard',
        roles: [Role.HiringManager, Role.DepartmentHead],
      },
    ],
  },
  {
    label: 'Recruitment',
    items: [
      {
        label: 'Requisitions',
        icon: 'pi pi-file-edit',
        route: '/console/requisitions',
        roles: [Role.HiringManager, Role.HRManager, Role.Admin, Role.SuperAdmin],
      },
      {
        label: 'Job Requisitions',
        icon: 'pi pi-list-check',
        route: '/console/job-requisitions',
        roles: [Role.HiringManager, Role.DepartmentHead, Role.HRManager, Role.Recruiter, Role.SuperAdmin],
      },
      {
        label: 'Approvals',
        icon: 'pi pi-check-square',
        route: '/console/approvals',
        roles: [Role.DepartmentHead, Role.FinanceApprover, Role.HRManager, Role.SuperAdmin],
        badge: 'pendingApprovals',
      },
      {
        label: 'Manpower Plan',
        icon: 'pi pi-sitemap',
        route: '/console/manpower-plan',
        roles: [Role.HRManager, Role.Admin, Role.SuperAdmin],
      },
      {
        label: 'Job Postings',
        icon: 'pi pi-briefcase',
        route: '/console/postings',
        roles: [Role.Recruiter, Role.HRManager, Role.SuperAdmin],
      },
      {
        label: 'Interviews',
        icon: 'pi pi-calendar',
        route: '/console/interviews',
      },
    ],
  },
  {
    label: 'Onboarding',
    items: [
      {
        label: 'Onboarding Cases',
        icon: 'pi pi-user-plus',
        route: '/console/onboarding',
        roles: [Role.OnboardingCoordinator, Role.HRManager, Role.SuperAdmin],
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        label: 'Reports & Analytics',
        icon: 'pi pi-chart-bar',
        route: '/console/reports',
        roles: [Role.HRManager, Role.Admin, Role.SuperAdmin],
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Plan Approval',
        icon: 'pi pi-wallet',
        route: '/finance/manpower-plan-approvals',
        roles: [Role.FinanceApprover, Role.Admin],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Users',
        icon: 'pi pi-users',
        route: '/console/admin/users',
        roles: [Role.Admin, Role.SuperAdmin],
      },
      {
        label: 'Squads',
        icon: 'pi pi-sitemap',
        route: '/console/admin/squads',
        roles: [Role.Admin, Role.SuperAdmin],
      },
      {
        label: 'Departments',
        icon: 'pi pi-building',
        route: '/console/admin/departments',
        roles: [
          Role.Admin,
          Role.SuperAdmin,
          Role.HRManager,
        ],
      },
      {
        label: 'Positions',
        icon: 'pi pi-id-card',
        route: '/console/admin/positions',
        roles: [Role.Admin, Role.SuperAdmin, Role.HRManager],
      },
      {
        label: 'Employees',
        icon: 'pi pi-users',
        route: '/console/admin/employees',
        roles: [Role.Admin, Role.SuperAdmin, Role.HRManager],
      },
    ],
  },
];
