import { Routes } from '@angular/router';
import { authGuard, guestRedirectGuard, roleGuard } from './core/guards/auth.guard';
import { Role } from './core/models/role.model';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/public-shell/public-shell.component').then((m) => m.PublicShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/job-postings/job-board.component').then((m) => m.JobBoardComponent),
      },
      {
        path: 'login',
        canActivate: [guestRedirectGuard],
        loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'signup',
        canActivate: [guestRedirectGuard],
        loadComponent: () => import('./features/auth/signup/signup.component').then((m) => m.SignupComponent),
      },
      {
  path: 'forgot-password',
  canActivate: [guestRedirectGuard],
  loadComponent: () =>
    import('./features/auth/forgot-password/forgot-password.component').then(
      (m) => m.ForgotPasswordComponent
    ),
},

{
  path: 'reset-password',
  canActivate: [guestRedirectGuard],
  loadComponent: () =>
    import('./features/auth/reset-password/reset-password.component').then(
      (m) => m.ResetPasswordComponent
    ),
},
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/otp-verification/otp-verification.component').then(
            (m) => m.OtpVerificationComponent,
          ),
      },
    ],
  },

  {
    path: 'console',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/console-shell/console-shell.component').then((m) => m.ConsoleShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      {
        path: 'requisitions',
        loadComponent: () =>
          import('./features/requisitions/list/requisition-list.component').then((m) => m.RequisitionListComponent),
      },
      {
        path: 'requisitions/new',
        canActivate: [roleGuard([Role.HiringManager])],
        loadComponent: () =>
          import('./features/requisitions/detail/requisition-detail.component').then(
            (m) => m.RequisitionDetailComponent,
          ),
      },
      {
        path: 'requisitions/:id',
        canActivate: [roleGuard([Role.HiringManager, Role.HRManager])],
        loadComponent: () =>
          import('./features/requisitions/detail/requisition-detail.component').then(
            (m) => m.RequisitionDetailComponent,
          ),
      },
      {
        path: 'approvals',
        canActivate: [roleGuard([Role.DepartmentHead, Role.FinanceApprover, Role.HRManager])],
        loadComponent: () =>
          import('./features/requisitions/approvals/approvals.component').then((m) => m.ApprovalsComponent),
      },
      {
        path: 'manpower-plan',
        canActivate: [roleGuard([Role.HRManager, Role.Admin])],
        loadComponent: () =>
          import('./features/manpower-plan/manpower-plan.component').then((m) => m.ManpowerPlanComponent),
      },
      {
        path: 'postings',
        canActivate: [roleGuard([Role.Recruiter, Role.HRManager])],
        loadComponent: () =>
          import('./features/job-postings/job-postings-manage.component').then(
            (m) => m.JobPostingsManageComponent,
          ),
      },
      {
        path: 'pipeline/:jobId',
        loadComponent: () => import('./features/pipeline/pipeline.component').then((m) => m.PipelineComponent),
      },
      {
        path: 'interviews',
        loadComponent: () =>
          import('./features/interviews/interviews.component').then((m) => m.InterviewsComponent),
      },
      {
        path: 'offers',
        canActivate: [roleGuard([Role.Recruiter, Role.HRManager])],
        loadComponent: () => import('./features/offers/offers.component').then((m) => m.OffersComponent),
      },
      {
        path: 'onboarding',
        canActivate: [roleGuard([Role.OnboardingCoordinator, Role.HRManager])],
        loadComponent: () =>
          import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
      },
      {
        path: 'reports',
        canActivate: [roleGuard([Role.HRManager, Role.Admin])],
        loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard([Role.Admin])],
        loadComponent: () =>
          import('./features/admin/users/user-management.component').then((m) => m.UserManagementComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
