// Job Requisition module routes. The JOB_REQUISITION_API provider lives here (not in
// app.config.ts) so the fake implementation ships inside this lazy chunk and one store
// instance is shared across the list, create and detail screens.
// SWAP: when the backend controller exists, replace useClass with the real HttpClient
// service extending JobRequisitionApi — no screen changes required.
import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';
import { Role } from '../../core/models/role.model';
import { JOB_REQUISITION_API } from '../../core/services/job-requisition-api';
import { FakeJobRequisitionService } from '../../core/services/job-requisition.service';

export const JOB_REQ_ROUTES: Routes = [
  {
    path: '',
    providers: [{ provide: JOB_REQUISITION_API, useClass: FakeJobRequisitionService }],
    children: [
      {
        path: 'new',
        canActivate: [roleGuard([Role.HiringManager])],
        loadComponent: () =>
          import('./create/job-req-create.component').then((m) => m.JobReqCreateComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./detail/job-req-detail.component').then((m) => m.JobReqDetailComponent),
      },
      {
        path: '',
        loadComponent: () =>
          import('./list/job-req-list.component').then((m) => m.JobReqListComponent),
      },
    ],
  },
];
