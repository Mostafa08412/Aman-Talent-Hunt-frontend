import { INTERNAL_ROLES, Role } from '../../core/models/role.model';

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
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        route: '/console',
        exact: true,
        roles: [Role.Admin, Role.FinanceApprover, Role.OnboardingCoordinator],
      },
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        route: '/console/recruiter-dashboard',
        roles: [Role.Recruiter],
      },
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        route: '/console/hr-manager-dashboard',
        roles: [Role.HRManager],
      },
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        route: '/console/hiring-manager-dashboard',
        roles: [Role.HiringManager],
      },
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        route: '/console/department-head-dashboard',
        roles: [Role.DepartmentHead],
      },
      {
        label: 'My Department',
        icon: 'pi pi-building',
        route: '/console/my-department',
        roles: [Role.DepartmentHead],
      },
    ],
  },
  {
    label: 'Requisitions',
    items: [
      {
        label: 'Requires My Action',
        icon: 'pi pi-clock',
        route: '/console/job-requisitions/pending-approval',
        roles: [Role.HiringManager, Role.DepartmentHead, Role.HRManager, Role.Recruiter, Role.SuperAdmin],
      },
      {
        label: 'Requested Modifications',
        icon: 'pi pi-exclamation-circle',
        route: '/console/job-requisitions/needs-fix',
        roles: [Role.HiringManager, Role.DepartmentHead, Role.Recruiter, Role.SuperAdmin],
      },
      {
        label: 'Mine',
        icon: 'pi pi-inbox',
        route: '/console/job-requisitions',
        exact: true,
        roles: [Role.HiringManager],
      },
      {
        label: 'Assigned',
        icon: 'pi pi-briefcase',
        route: '/console/job-requisitions/assigned',
        roles: [Role.DepartmentHead, Role.HRManager, Role.Recruiter, Role.SuperAdmin],
      },
    ],
  },
  {
    label: 'Recruitment',
    items: [
      {
        label: 'Job Posts',
        icon: 'pi pi-briefcase',
        route: '/console/postings',
        exact: true,
        roles: [Role.Recruiter, Role.HRManager, Role.SuperAdmin, Role.HiringManager],
      },
      {
        label: 'Assigned Job Posts',
        icon: 'pi pi-user',
        route: '/console/postings/assigned',
        roles: [Role.Recruiter, Role.HiringManager],
      },
      {
        label: 'Interviews',
        icon: 'pi pi-calendar',
        route: '/console/interviews',
        roles: INTERNAL_ROLES.filter((r) => r !== Role.DepartmentHead),
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
        roles: [Role.Admin, Role.SuperAdmin, Role.HRManager]
      },
      {
        label: 'Positions',
        icon: 'pi pi-id-card',
        route: '/console/admin/positions',
        roles: [Role.Admin, Role.SuperAdmin, Role.HRManager, Role.Recruiter],
      },
            {
        label: 'Job Descriptions',
        icon: 'pi pi-file-edit',
        route: '/console/admin/job-descriptions',
        roles: [Role.Admin, Role.SuperAdmin, Role.HRManager, Role.Recruiter] ,
      },
      {
        label: 'Employees',
        icon: 'pi pi-users',
        route: '/console/admin/employees',
        roles: [Role.Admin, Role.SuperAdmin, Role.HRManager],
      },
      {
        label: 'Man Power Plans',
        icon: 'pi pi-calendar-clock',
        route: '/console/manpower-plan',
        roles: [Role.Admin, Role.SuperAdmin, Role.HRManager, Role.DepartmentHead],
      },
    ],
  },
];

/** Route to a given role's dashboard (used for post-login landing and /console routing). */
export function dashboardRouteFor(role: Role): string {
  switch (role) {
    case Role.Recruiter:
      return '/console/recruiter-dashboard';
    case Role.HRManager:
      return '/console/hr-manager-dashboard';
    case Role.HiringManager:
      return '/console/hiring-manager-dashboard';
    case Role.DepartmentHead:
      return '/console/department-head-dashboard';
    case Role.SuperAdmin:
      return '/console/admin/employees';
    default:
      return '/console';
  }
}
