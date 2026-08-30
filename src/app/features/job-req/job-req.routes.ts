// Job Requisition module routes. The JOB_REQUISITION_API provider lives here (not in
// app.config.ts) so one store-ish instance is shared across the list, create and detail
// screens and only the provider needs swapping to move implementations.
// The real HttpClient service backs the screens via the concrete HTTP implementation.
import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';
import { Role } from '../../core/models/role.model';
import { JOB_REQUISITION_API } from '../../core/services/job-requisition-api';
import { JobRequisitionHttpService } from '../../core/services/job-requisition-http.service';

export const JOB_REQ_ROUTES: Routes = [
  {
    path: '',
    providers: [{ provide: JOB_REQUISITION_API, useClass: JobRequisitionHttpService }],
    children: [
      {
        path: 'new',
        canActivate: [roleGuard([Role.HiringManager])],
        loadComponent: () =>
          import('./create/job-req-create.component').then((m) => m.JobReqCreateComponent),
      },
      // Sidebar-mapped queues (under the "Requisitions" nav divider). Each shares the
      // list component with a view resolved from the route data. "All" stays at the
      // base route (/console/job-requisitions).
      {
        path: 'pending-approval',
        data: { view: 'pendingMyApproval' },
        loadComponent: () =>
          import('./list/job-req-list.component').then((m) => m.JobReqListComponent),
      },
      {
        path: 'needs-fix',
        data: { view: 'pendingMyModification' },
        loadComponent: () =>
          import('./list/job-req-list.component').then((m) => m.JobReqListComponent),
      },
      {
        path: 'assigned',
        data: { view: 'assigned' },
        loadComponent: () =>
          import('./list/job-req-list.component').then((m) => m.JobReqListComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./detail/job-req-detail.component').then((m) => m.JobReqDetailComponent),
      },
      {
        path: '',
        data: { view: 'all' },
        loadComponent: () =>
          import('./list/job-req-list.component').then((m) => m.JobReqListComponent),
      },
    ],
  },
];
