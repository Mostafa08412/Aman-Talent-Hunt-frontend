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
          import(
            './features/candidate-portal/public-job-posts/jobs-page/jobs-page.component'
          ).then((m) => m.JobsPageComponent),
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import(
            './features/candidate-portal/public-job-posts/jobs-page/jobs-page.component'
          ).then((m) => m.JobsPageComponent),
      },
      {
        path: 'jobs/:id',
        loadComponent: () =>
          import('./features/candidate-portal/job-details/job-details.component').then(
            (m) => m.JobDetailsComponent,
          ),
      },

      {
        path: 'account',
        canActivate: [authGuard],
        loadComponent: () =>
          import(
            './features/candidate-portal/account-settings/account-settings-shell.component'
          ).then((m) => m.AccountSettingsShellComponent),
        children: [
          { path: '', redirectTo: 'personal-information', pathMatch: 'full' },
          {
            path: 'personal-information',
            loadComponent: () =>
              import(
                './features/candidate-portal/account-settings/personal-info/personal-info.component'
              ).then((m) => m.PersonalInfoComponent),
          },
          {
            path: 'security-password',
            loadComponent: () =>
              import(
                './features/candidate-portal/account-settings/security-password/security-password.component'
              ).then((m) => m.SecurityPasswordComponent),
          },
          {
            path: 'resume',
            loadComponent: () =>
              import(
                './features/candidate-portal/account-settings/resume/profile-resume.component'
              ).then((m) => m.ProfileResumeComponent),
          },
          {
            path: 'applications',
            loadComponent: () =>
              import(
                './features/candidate-portal/account-settings/applications/application-history.component'
              ).then((m) => m.ApplicationHistoryComponent),
          },
          {
            path: 'applications/:id',
            loadComponent: () =>
              import(
                './features/candidate-portal/account-settings/applications/application-details.component'
              ).then((m) => m.ApplicationDetailsComponent),
          },
        ],
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
        canActivate: [roleGuard([Role.HiringManager, Role.SuperAdmin])],
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
        path: 'requisitions/:id/select',
        canActivate: [roleGuard([Role.HiringManager])],
        loadComponent: () =>
          import('./features/requisitions/finalist-selection/finalist-selection.component').then(
            (m) => m.FinalistSelectionComponent,
          ),
      },
      {
        path: 'approvals',
        canActivate: [roleGuard([Role.DepartmentHead, Role.FinanceApprover, Role.HRManager, Role.SuperAdmin])],
        loadComponent: () =>
          import('./features/requisitions/approvals/approvals.component').then((m) => m.ApprovalsComponent),
      },
      {
        path: 'manpower-plan/new',
        canActivate: [roleGuard([Role.HRManager, Role.Admin, Role.SuperAdmin])],
        loadComponent: () =>
          import('./features/manpower-plan/manpower-plan-add.component').then(
            (m) => m.ManpowerPlanAddComponent,
          ),
      },
      {
        path: 'manpower-plan/:id',
        canActivate: [roleGuard([Role.HRManager, Role.Admin, Role.SuperAdmin])],
        loadComponent: () =>
          import('./features/manpower-plan/manpower-plan-detail.component').then(
            (m) => m.ManpowerPlanDetailComponent,
          ),
      },
      {
        path: 'manpower-plan',
        canActivate: [roleGuard([Role.HRManager, Role.Admin, Role.SuperAdmin])],
        loadComponent: () =>
          import('./features/manpower-plan/manpower-plan.component').then((m) => m.ManpowerPlanComponent),
      },
      {
        path: 'postings',
        canActivate: [roleGuard([Role.Recruiter, Role.HRManager, Role.SuperAdmin])],
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
        path: 'interviews/:id',
        canActivate: [roleGuard([Role.HiringManager, Role.Recruiter])],
        loadComponent: () =>
          import('./features/interviews/scorecard/interviews-scorecard.component').then(
            (m) => m.InterviewsScorecardComponent,
          ),
      },
      {
        path: 'offers',
        canActivate: [roleGuard([Role.Recruiter, Role.HRManager, Role.SuperAdmin])],
        loadComponent: () => import('./features/offers/offers.component').then((m) => m.OffersComponent),
      },
      {
        path: 'onboarding',
        canActivate: [roleGuard([Role.OnboardingCoordinator, Role.HRManager, Role.SuperAdmin])],
        loadComponent: () =>
          import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
      },
      {
        path: 'reports',
        canActivate: [roleGuard([Role.HRManager, Role.Admin, Role.SuperAdmin])],
        loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard([Role.Admin, Role.SuperAdmin])],
        loadComponent: () =>
          import('./features/admin/users/user-management.component').then((m) => m.UserManagementComponent),
      },
      {
        path: 'admin/users/new',
        canActivate: [roleGuard([Role.Admin, Role.SuperAdmin])],
        loadComponent: () =>
          import('./features/admin/users/user-add.component').then((m) => m.UserAddComponent),
      },
      {
        path: 'admin/squads',
        canActivate: [roleGuard([Role.Admin, Role.SuperAdmin])],
        loadComponent: () =>
          import('./features/admin/squads/squads.component').then((m) => m.SquadsComponent),
      },
      {
        path: 'admin/positions',
        canActivate: [roleGuard([Role.Admin, Role.SuperAdmin, Role.HRManager])],
        loadComponent: () =>
          import('./features/admin/positions/positions.component').then((m) => m.PositionsComponent),
      },
      {
        path: 'admin/employees',
        canActivate: [roleGuard([Role.Admin, Role.SuperAdmin, Role.HRManager])],
        loadComponent: () =>
          import('./features/admin/employees/employees.component').then((m) => m.EmployeesComponent),
      },
      {
        path: 'admin/employees/new',
        canActivate: [roleGuard([Role.Admin, Role.SuperAdmin])],
        loadComponent: () =>
          import('./features/admin/employees/employee-add.component').then((m) => m.EmployeeAddComponent),
      },
      {
        path: 'admin/employees/:id',
        canActivate: [roleGuard([Role.Admin, Role.SuperAdmin, Role.HRManager])],
        loadComponent: () =>
          import('./features/admin/employees/employee-edit.component').then((m) => m.EmployeeEditComponent),
      },
    ],
  },

  // Same console shell as `console`, at its own `/hm` prefix per wireframe #9 (HM Workstation
  // Dashboard) so the URL stays /hm/dashboard rather than nesting it under /console.
  {
    path: 'hm',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/console-shell/console-shell.component').then((m) => m.ConsoleShellComponent),
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard([Role.HiringManager, Role.DepartmentHead])],
        loadComponent: () =>
          import('./features/hm-dashboard/hm-dashboard.component').then((m) => m.HmDashboardComponent),
      },
    ],
  },

  // Same console shell as `console`, at its own `/finance` prefix per wireframe #24 (Finance
  // Plan Approval View) so the URL stays /finance/manpower-plan-approvals rather than nesting
  // it under /console.
  {
    path: 'finance',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/console-shell/console-shell.component').then((m) => m.ConsoleShellComponent),
    children: [
      {
        path: 'manpower-plan-approvals',
        canActivate: [roleGuard([Role.FinanceApprover, Role.Admin])],
        loadComponent: () =>
          import('./features/finance/plan-approval/finance-plan-approval.component').then(
            (m) => m.FinancePlanApprovalComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
