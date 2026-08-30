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

import { RecruiterDashboardService } from '@core/services/recruiter-dashboard.service';
import { DedupMessageService } from '@core/services/dedup-message.service';
import { HumanizePipe } from '../../shared/pipes/humanize.pipe';
import type {
  RecruiterDashboardDto,
  RecruiterDashboardRequisitionToDo,
} from '@core/models/recruiter-dashboard-model';
import { ApplicationStatus, JobPostStatus } from '@core/models/enums';
import { JobRequisitionStatus } from '@core/models/job-requisition-model';

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
  selector: 'app-recruiter-dashboard',
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
  templateUrl: './recruiter-dashboard.component.html',
  styleUrl: './recruiter-dashboard.component.scss',
})
export class RecruiterDashboardComponent implements OnInit {
  private dashboardService = inject(RecruiterDashboardService);
  private message = inject(MessageService);
  private router = inject(Router);

  readonly ApplicationStatus = ApplicationStatus;

  loading = signal(true);
  loadError = signal<string | null>(null);
  data = signal<RecruiterDashboardDto | null>(null);

  readonly counts = computed(() => this.data()?.counts);

  /** Speed-dial cards. */
  readonly statCards = computed<StatCard[]>(() => {
    const c = this.counts();
    return [
      { key: 'activeJobPosts', label: 'Active Job Posts', icon: 'pi pi-briefcase', accent: 'teal', value: c?.activeJobPosts ?? 0 },
      { key: 'requisitionsNeedingAction', label: 'Requisitions To Act', icon: 'pi pi-list-check', accent: 'orange', value: c?.requisitionsNeedingAction ?? 0 },
      { key: 'openApplications', label: 'Open Applications', icon: 'pi pi-inbox', accent: 'indigo', value: c?.openApplications ?? 0 },
      { key: 'interviewsToday', label: 'Interviews Today', icon: 'pi pi-calendar-clock', accent: 'green', value: c?.interviewsToday ?? 0 },
      { key: 'shortlistedCandidates', label: 'Shortlisted', icon: 'pi pi-user-check', accent: 'violet', value: c?.shortlistedCandidates ?? 0 },
    ];
  });

  /** Convenience collection accessors so templates avoid null-unsafe property chains. */
  readonly jobPosts = computed(() => this.data()?.jobPosts ?? []);
  readonly requisitionToDos = computed(() => this.data()?.requisitionToDos ?? []);
  readonly upcomingInterviews = computed(() => this.data()?.upcomingInterviews ?? []);
  readonly recentApplications = computed(() => this.data()?.recentApplications ?? []);

  /** Pipeline buckets split so the active funnel stays visually separate. */
  readonly activePipeline = computed(() =>
    (this.data()?.pipelineStatusCounts ?? []).filter((c) => !TERMINAL_STATUSES.has(c.status)),
  );
  readonly terminalPipeline = computed(() =>
    (this.data()?.pipelineStatusCounts ?? []).filter((c) => TERMINAL_STATUSES.has(c.status)),
  );

  /** Largest bucket count — used to compute relative bar widths for the funnel. */
  readonly pipelineMax = computed(() => {
    const counts = [...this.activePipeline(), ...this.terminalPipeline()].map((c) => c.count);
    return counts.length ? Math.max(...counts) : 1;
  });

  readonly terminalSum = computed(() =>
    this.terminalPipeline().reduce((sum, c) => sum + c.count, 0),
  );

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.dashboardService.getRecruiterDashboard().subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
          this.loadError.set('Unable to load your recruiter dashboard right now.');
          if (res.message) {
            this.message.add({ severity: 'error', summary: 'Dashboard error', detail: res.message });
          }
        } else {
          this.data.set(res.data ?? null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load your recruiter dashboard right now.');
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

  /* ── TrackBy helpers (mandatory for tables/lists) ── */

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

  barWidth(count: number): string {
    return `${Math.round((count / this.pipelineMax()) * 100)}%`;
  }

  requisitionActionHint(req: RecruiterDashboardRequisitionToDo): string {
    switch (req.status) {
      case JobRequisitionStatus.PendingAttachingJD:
        return 'Attach JD';
      case JobRequisitionStatus.Approved:
        return 'Create / publish job post';
      case JobRequisitionStatus.RequestedModifications:
        return 'Fix & resubmit';
      default:
        return '';
    }
  }

  requisitionSeverity(status: JobRequisitionStatus): TagSeverity {
    switch (status) {
      case JobRequisitionStatus.Approved:
        return 'success';
      case JobRequisitionStatus.RequestedModifications:
        return 'warn';
      default:
        return 'info';
    }
  }

  jobPostSeverity(status: JobPostStatus): TagSeverity {
    switch (status) {
      case JobPostStatus.Published:
        return 'success';
      case JobPostStatus.OnHold:
      case JobPostStatus.Draft:
        return 'warn';
      default:
        return 'secondary';
    }
  }

  applicationSeverity(status: ApplicationStatus): TagSeverity {
    switch (status) {
      case ApplicationStatus.Hired:
      case ApplicationStatus.OfferAccepted:
        return 'success';
      case ApplicationStatus.Rejected:
      case ApplicationStatus.Withdrawn:
      case ApplicationStatus.OfferDeclined:
        return 'danger';
      default:
        return 'info';
    }
  }

  /** Flag a Published post that is past its deadline. */
  isExpired(deadline: string | null): boolean {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  }
}
