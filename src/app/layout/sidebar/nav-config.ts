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
    ],
  },
  {
    label: 'Recruitment',
    items: [
      {
        label: 'Job Requisitions',
        icon: 'pi pi-list-check',
        route: '/console/job-requisitions',
        roles: [Role.HiringManager, Role.DepartmentHead, Role.HRManager, Role.Recruiter, Role.SuperAdmin],
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
