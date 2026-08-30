import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';

import { HrManagerDashboardService } from '@core/services/hr-manager-dashboard.service';
import { DedupMessageService } from '@core/services/dedup-message.service';
import { HumanizePipe } from '../../shared/pipes/humanize.pipe';
import type {
  HrManagerDashboardDto,
  HrManagerRecruiterWorkload,
} from '@core/models/hr-manager-dashboard-model';
import { ApplicationStatus } from '@core/models/enums';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

interface StatCard {
  key: string;
  label: string;
  icon: string;
  accent: string;
  value: number;
}

const TERMINAL_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.Hired,
  ApplicationStatus.Rejected,
  ApplicationStatus.Withdrawn,
  ApplicationStatus.OfferDeclined,
]);

@Component({
  selector: 'app-hr-manager-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    CardModule,
    ButtonModule,
    TagModule,
    AvatarModule,
    ProgressSpinnerModule,
    MessageModule,
    HumanizePipe,
  ],
  providers: [{ provide: MessageService, useClass: DedupMessageService }],
  templateUrl: './hr-manager-dashboard.component.html',
  styleUrl: './hr-manager-dashboard.component.scss',
})
export class HrManagerDashboardComponent implements OnInit {
  private dashboardService = inject(HrManagerDashboardService);
  private message = inject(MessageService);
  private router = inject(Router);

  loading = signal(true);
  loadError = signal<string | null>(null);
  data = signal<HrManagerDashboardDto | null>(null);

  readonly counts = computed(() => this.data()?.counts);

  readonly statCards = computed<StatCard[]>(() => {
    const c = this.counts();
    return [
      { key: 'requisitionsPendingApproval', label: 'Requisitions To Approve', icon: 'pi pi-file-check', accent: 'orange', value: c?.requisitionsPendingApproval ?? 0 },
      { key: 'manPowerPlansPendingApproval', label: 'Plans To Approve', icon: 'pi pi-user-plus', accent: 'indigo', value: c?.manPowerPlansPendingApproval ?? 0 },
      { key: 'openJobPosts', label: 'Open Job Posts', icon: 'pi pi-briefcase', accent: 'teal', value: c?.openJobPosts ?? 0 },
      { key: 'openApplications', label: 'Open Applications', icon: 'pi pi-inbox', accent: 'green', value: c?.openApplications ?? 0 },
      { key: 'activeManPowerPlans', label: 'Active Plans', icon: 'pi pi-calendar-clock', accent: 'violet', value: c?.activeManPowerPlans ?? 0 },
    ];
  });

  readonly requisitionsToApprove = computed(() => this.data()?.requisitionsToApprove ?? []);
  readonly manPowerPlansToApprove = computed(() => this.data()?.manPowerPlansToApprove ?? []);
  readonly recruiterWorkload = computed(() => this.data()?.recruiterWorkload ?? []);
  readonly headcountByDepartment = computed(() => this.data()?.headcountByDepartment ?? []);
  readonly applicationInflow = computed(() => this.data()?.applicationInflow ?? []);
  readonly pipelineSummary = computed(() => this.data()?.pipelineSummary ?? []);

  /** Combined approval inbox (requisitions first, then plans). */
  readonly approvalInbox = computed(() => {
    const reqs = this.requisitionsToApprove();
    const plans = this.manPowerPlansToApprove();
    return {
      requisitions: reqs,
      plans,
      total: reqs.length + plans.length,
    };
  });

  /** Biggest recruiter workload (assigned requisitions) — for relative bars. */
  readonly workloadMax = computed(() => {
    const values = this.recruiterWorkload().map((w) => w.assignedRequisitions);
    return values.length ? Math.max(...values) : 1;
  });

  /** Largest filler just for bar width normalization across sections. */
  readonly pipelineMax = computed(() => {
    const values = this.pipelineSummary().map((p) => p.count);
    return values.length ? Math.max(...values) : 1;
  });

  readonly inflowMax = computed(() => {
    const values = this.applicationInflow().map((w) => w.count);
    return values.length ? Math.max(...values) : 1;
  });

  readonly headcountMax = computed(() => {
    const values = this.headcountByDepartment().map((h) => h.targetHeadcount);
    return values.length ? Math.max(...values) : 1;
  });

  /** Recruiter workload sorted by assigned requisitions (desc) to surface imbalance. */
  readonly workloadSorted = computed<HrManagerRecruiterWorkload[]>(() =>
    [...this.recruiterWorkload()].sort((a, b) => b.assignedRequisitions - a.assignedRequisitions),
  );

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.dashboardService.getHrManagerDashboard().subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
          this.loadError.set('Unable to load your HR dashboard right now.');
          if (res.message) {
            this.message.add({ severity: 'error', summary: 'Dashboard error', detail: res.message });
          }
        } else {
          this.data.set(res.data ?? null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load your HR dashboard right now.');
        this.loading.set(false);
      },
    });
  }

  /* ── Navigation ── */

  openRequisition(id: string): void {
    this.router.navigate(['/console/job-requisitions', id]);
  }

  openManPowerPlan(id: string): void {
    this.router.navigate(['/console/manpower-plan', id]);
  }

  /* ── TrackBy helpers ── */

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  trackByStatus(_index: number, item: { status: string }): string {
    return item.status;
  }

  /* ── Display helpers ── */

  initials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase();
  }

  barWidth(count: number, max: number): string {
    return `${max > 0 ? Math.round((count / max) * 100) : 0}%`;
  }

  workloadWidth(w: HrManagerRecruiterWorkload): string {
    return this.barWidth(w.assignedRequisitions, this.workloadMax());
  }

  pipelineSeverity(status: ApplicationStatus): TagSeverity {
    switch (status) {
      case ApplicationStatus.Hired:
      case ApplicationStatus.OfferAccepted:
        return 'success';
      case ApplicationStatus.Rejected:
      case ApplicationStatus.Withdrawn:
      case ApplicationStatus.OfferDeclined:
        return 'danger';
      case ApplicationStatus.OfferExtended:
        return 'warn';
      default:
        return 'info';
    }
  }

  isTerminal(status: ApplicationStatus): boolean {
    return TERMINAL_STATUSES.has(status);
  }
}
