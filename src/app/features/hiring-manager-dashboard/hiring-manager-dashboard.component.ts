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

import { HiringManagerDashboardService } from '@core/services/hiring-manager-dashboard.service';
import { DedupMessageService } from '@core/services/dedup-message.service';
import { HumanizePipe } from '../../shared/pipes/humanize.pipe';
import type {
  HiringManagerDashboardDto,
  HiringManagerJobPost,
} from '@core/models/hiring-manager-dashboard-model';
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
  selector: 'app-hiring-manager-dashboard',
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
  templateUrl: './hiring-manager-dashboard.component.html',
  styleUrl: './hiring-manager-dashboard.component.scss',
})
export class HiringManagerDashboardComponent implements OnInit {
  private dashboardService = inject(HiringManagerDashboardService);
  private message = inject(MessageService);
  private router = inject(Router);

  loading = signal(true);
  loadError = signal<string | null>(null);
  data = signal<HiringManagerDashboardDto | null>(null);

  readonly counts = computed(() => this.data()?.counts);
  readonly timeMetrics = computed(() => this.data()?.timeMetrics);

  readonly statCards = computed<StatCard[]>(() => {
    const c = this.counts();
    return [
      { key: 'activeJobPosts', label: 'Active Job Posts', icon: 'pi pi-briefcase', accent: 'teal', value: c?.activeJobPosts ?? 0 },
      { key: 'openApplications', label: 'Open Applications', icon: 'pi pi-inbox', accent: 'green', value: c?.openApplications ?? 0 },
      { key: 'pendingJDApprovals', label: 'JD Approvals', icon: 'pi pi-file-check', accent: 'orange', value: c?.pendingJDApprovals ?? 0 },
      { key: 'hiresInPeriod', label: 'Hires (90d)', icon: 'pi pi-user-check', accent: 'indigo', value: c?.hiresInPeriod ?? 0 },
      { key: 'newApplicantsInPeriod', label: 'New Applicants (90d)', icon: 'pi pi-user-plus', accent: 'violet', value: c?.newApplicantsInPeriod ?? 0 },
    ];
  });

  readonly pipelineSummary = computed(() => this.data()?.pipelineStatusCounts ?? []);
  readonly jobPosts = computed(() => this.data()?.jobPosts ?? []);
  readonly requisitionsToApprove = computed(() => this.data()?.requisitionsToApprove ?? []);
  readonly recentHires = computed(() => this.data()?.recentHires ?? []);
  readonly upcomingInterviews = computed(() => this.data()?.upcomingInterviews ?? []);

  readonly pipelineMax = computed(() => {
    const values = this.pipelineSummary().map((p) => p.count);
    return values.length ? Math.max(...values) : 1;
  });

  readonly formatDays = (days: number | null | undefined): string =>
    days === null || days === undefined ? '—' : `${days.toFixed(1)} d`;

  readonly formatCount = (n: number): string =>
    `${n} ${n === 1 ? 'record' : 'records'}`;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.dashboardService.getHiringManagerDashboard().subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
          this.loadError.set('Unable to load your hiring dashboard right now.');
          if (res.message) {
            this.message.add({ severity: 'error', summary: 'Dashboard error', detail: res.message });
          }
        } else {
          this.data.set(res.data ?? null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load your hiring dashboard right now.');
        this.loading.set(false);
      },
    });
  }

  /* ── Navigation ── */

  openJobPost(id: string): void {
    this.router.navigate(['/console/postings', id]);
  }

  openRequisition(id: string): void {
    this.router.navigate(['/console/job-requisitions', id]);
  }

  openInterview(id: string): void {
    this.router.navigate(['/console/interviews', id]);
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

  isJobPostClosed(post: HiringManagerJobPost): boolean {
    return post.status === 'Closed' || post.status === 'Filled';
  }
}
