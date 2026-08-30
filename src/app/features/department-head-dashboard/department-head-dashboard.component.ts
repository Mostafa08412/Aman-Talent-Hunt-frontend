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

import { DepartmentHeadDashboardService } from '@core/services/department-head-dashboard.service';
import { DedupMessageService } from '@core/services/dedup-message.service';
import { HumanizePipe } from '../../shared/pipes/humanize.pipe';
import type {
  DepartmentHeadDashboardDto,
  DepartmentHeadManPowerPlan,
} from '@core/models/department-head-dashboard-model';
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
  selector: 'app-department-head-dashboard',
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
  templateUrl: './department-head-dashboard.component.html',
  styleUrl: './department-head-dashboard.component.scss',
})
export class DepartmentHeadDashboardComponent implements OnInit {
  private dashboardService = inject(DepartmentHeadDashboardService);
  private message = inject(MessageService);
  private router = inject(Router);

  loading = signal(true);
  loadError = signal<string | null>(null);
  data = signal<DepartmentHeadDashboardDto | null>(null);

  readonly counts = computed(() => this.data()?.counts);
  readonly headcountSummary = computed(() => this.data()?.headcountSummary);

  readonly statCards = computed<StatCard[]>(() => {
    const c = this.counts();
    return [
      { key: 'budgetApprovalsPending', label: 'Budget Approvals', icon: 'pi pi-wallet', accent: 'orange', value: c?.budgetApprovalsPending ?? 0 },
      { key: 'inFlightRequisitions', label: 'In-Flight Requisitions', icon: 'pi pi-file-check', accent: 'teal', value: c?.inFlightRequisitions ?? 0 },
      { key: 'activeJobPosts', label: 'Active Job Posts', icon: 'pi pi-briefcase', accent: 'indigo', value: c?.activeJobPosts ?? 0 },
      { key: 'openApplications', label: 'Open Applications', icon: 'pi pi-inbox', accent: 'green', value: c?.openApplications ?? 0 },
      { key: 'activeManPowerPlans', label: 'Active Plans', icon: 'pi pi-calendar-clock', accent: 'violet', value: c?.activeManPowerPlans ?? 0 },
    ];
  });

  readonly budgetApprovals = computed(() => this.data()?.budgetApprovals ?? []);
  readonly pipelineSummary = computed(() => this.data()?.pipelineStatusCounts ?? []);
  readonly manPowerPlans = computed(() => this.data()?.manPowerPlans ?? []);
  readonly jobPosts = computed(() => this.data()?.jobPosts ?? []);

  readonly pipelineMax = computed(() => {
    const values = this.pipelineSummary().map((p) => p.count);
    return values.length ? Math.max(...values) : 1;
  });

  /** Whether any plan is a non-counted draft/pending/rejected — show the informational note. */
  readonly hasInformationalPlans = computed(() =>
    this.manPowerPlans().some((p) => this.isInformational(p)),
  );

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.dashboardService.getDepartmentHeadDashboard().subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
          this.loadError.set('Unable to load your department dashboard right now.');
          if (res.message) {
            this.message.add({ severity: 'error', summary: 'Dashboard error', detail: res.message });
          }
        } else {
          this.data.set(res.data ?? null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load your department dashboard right now.');
        this.loading.set(false);
      },
    });
  }

  /* ── Navigation ── */

  openRequisition(id: string): void {
    this.router.navigate(['/console/job-requisitions', id]);
  }

  openJobPost(id: string): void {
    this.router.navigate(['/console/postings', id]);
  }

  openManPowerPlan(id: string): void {
    this.router.navigate(['/console/manpower-plan', id]);
  }

  /* ── TrackBy helpers ── */

  trackById(_index: number, item: { id: string }): string {
    return item.id;
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

  headcountPercent(): number {
    const h = this.headcountSummary();
    if (!h || h.targetHeadcount <= 0) return 0;
    return Math.round((h.filledHeadcount / h.targetHeadcount) * 100);
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

  jobPostTagSeverity(status: string): TagSeverity {
    switch (status) {
      case 'Published':
        return 'success';
      case 'OnHold':
        return 'warn';
      case 'Filled':
        return 'info';
      case 'Closed':
        return 'secondary';
      default:
        return 'contrast';
    }
  }

  isExpired(post: { status: string; deadline: string | null }): boolean {
    if (!post.deadline) return false;
    return post.status === 'Published' && new Date(post.deadline) < new Date();
  }

  planStatusSeverity(status: string): TagSeverity {
    switch (status) {
      case 'Active':
      case 'Fulfilled':
        return 'success';
      case 'Approved':
        return 'info';
      case 'PendingApproval':
        return 'warn';
      case 'Rejected':
      case 'Closed':
        return 'secondary';
      default:
        return 'contrast';
    }
  }

  isInformational(plan: DepartmentHeadManPowerPlan): boolean {
    return plan.status === 'Draft' || plan.status === 'PendingApproval' || plan.status === 'Rejected';
  }
}
