import { Role } from '../../core/models/role.model';

export interface NavItem {
  label: string;
  icon: string; // PrimeIcons class, e.g. 'pi pi-home'
  route: string;
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
    items: [{ label: 'Dashboard', icon: 'pi pi-home', route: '/console' }],
  },
  {
    label: 'Recruitment',
    items: [
      {
        label: 'Requisitions',
        icon: 'pi pi-file-edit',
        route: '/console/requisitions',
        roles: [Role.HiringManager, Role.HRManager, Role.Admin],
      },
      {
        label: 'Approvals',
        icon: 'pi pi-check-square',
        route: '/console/approvals',
        roles: [Role.DepartmentHead, Role.FinanceApprover, Role.HRManager],
        badge: 'pendingApprovals',
      },
      {
        label: 'Manpower Plan',
        icon: 'pi pi-sitemap',
        route: '/console/manpower-plan',
        roles: [Role.HRManager, Role.Admin],
      },
      {
        label: 'Job Postings',
        icon: 'pi pi-briefcase',
        route: '/console/postings',
        roles: [Role.Recruiter, Role.HRManager],
      },
      {
        label: 'Interviews',
        icon: 'pi pi-calendar',
        route: '/console/interviews',
        roles: [Role.Recruiter, Role.HiringManager, Role.HRManager],
      },
      {
        label: 'Offers',
        icon: 'pi pi-send',
        route: '/console/offers',
        roles: [Role.Recruiter, Role.HRManager],
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
        roles: [Role.OnboardingCoordinator, Role.HRManager],
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
        roles: [Role.HRManager, Role.Admin],
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
        roles: [Role.Admin],
      },
    ],
  },
];
