import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  RequisitionService,
  RequisitionSummary,
  RequisitionStage,
  RequisitionHoldState,
} from '../../core/services/requisition.service';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/role.model';

@Component({
  selector: 'app-hm-dashboard',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule, TableModule, TagModule, ProgressSpinnerModule],
  templateUrl: './hm-dashboard.component.html',
  styleUrl: './hm-dashboard.component.scss',
})
export class HmDashboardComponent {
  private requisitionService = inject(RequisitionService);
  private auth = inject(AuthService);

  /** Only the Hiring Manager can create requisitions. */
  readonly canCreateRequisition = this.auth.hasRole(Role.HiringManager);

  loading = signal(true);
  requisitions = signal<RequisitionSummary[]>([]);
  stats = signal({ activeReqs: 0, pendingTechEval: 0, pendingApproval: 0, totalThisAtc: 0 });

  statusLabel(req: RequisitionSummary): string {
    if (req.holdState === RequisitionHoldState.OnHold) return 'On Hold';
    if (req.holdState === RequisitionHoldState.Cancelled) return 'Cancelled';
    return req.stage;
  }

  statusSeverity(req: RequisitionSummary): 'info' | 'warn' | 'success' | 'danger' | 'secondary' {
    if (req.holdState === RequisitionHoldState.OnHold) return 'warn';
    if (req.holdState === RequisitionHoldState.Cancelled) return 'danger';
    if (req.stage === RequisitionStage.Filled) return 'success';
    if (req.stage === RequisitionStage.Approval) return 'info';
    return 'secondary';
  }

  constructor() {
    this.requisitionService.getMyRequisitions().subscribe((reqs) => {
      this.requisitions.set(reqs);
      this.loading.set(false);
    });
    this.requisitionService.getDashboardStats().subscribe((stats) => this.stats.set(stats));
  }
}
