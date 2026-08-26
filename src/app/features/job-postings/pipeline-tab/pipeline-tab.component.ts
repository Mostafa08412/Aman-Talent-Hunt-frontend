import { Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MenuModule } from 'primeng/menu';
import { DrawerModule } from 'primeng/drawer';

import {
  AdminApplicationsQueryParams,
  AdminApplicationsService,
} from '@core/services/admin-applications.service';
import { AuthService } from '@core/services/auth.service';
import { ApplicantListItemDto } from '@core/models/admin-application-model';
import { ApplicationStatus } from '@core/models/enums';
import { TERMINAL_STATUSES, isTerminal, isValidTransition, nextStatuses } from '@core/models/application-status-transitions';

import { StatusBadgeComponent, humanizeEnum } from '../shared/status-badge.component';
import { RelativeTimePipe } from '../shared/relative-time.pipe';
import { ApplicantDetailDrawerComponent } from '../shared/applicant-detail-drawer.component';
import { ScheduleInterviewDialogComponent } from '../shared/schedule-interview-dialog.component';

/** Board column definition (guide §5.1). */
interface ColumnDef {
  status: ApplicationStatus;
  label: string;
}

const BOARD_COLUMNS: ColumnDef[] = [
  { status: ApplicationStatus.Screened, label: 'Screened' },
  { status: ApplicationStatus.Shortlisted, label: 'Shortlisted' },
  { status: ApplicationStatus.InterviewScheduled, label: 'Interview Scheduled' },
  { status: ApplicationStatus.InterviewCompleted, label: 'Interview Completed' },
  { status: ApplicationStatus.OfferExtended, label: 'Offer Extended' },
  { status: ApplicationStatus.OfferAccepted, label: 'Offer Accepted' },
  { status: ApplicationStatus.Hired, label: 'Hired' },
];

const REJECTED_FACETS: ApplicationStatus[] = [
  ApplicationStatus.Rejected,
  ApplicationStatus.Withdrawn,
  ApplicationStatus.OfferDeclined,
];

/**
 * Pipeline tab (guide §5): counts strip + kanban columns + card menus.
 * Stage moves happen via menus only (no drag-drop per product decision).
 */
@Component({
  selector: 'app-pipeline-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MenuModule,
    DrawerModule,
    StatusBadgeComponent,
    RelativeTimePipe,
    ApplicantDetailDrawerComponent,
    ScheduleInterviewDialogComponent,
  ],
  templateUrl: './pipeline-tab.component.html',
  styleUrl: './pipeline-tab.component.scss',
})
export class PipelineTabComponent {
  private readonly applicationsService = inject(AdminApplicationsService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly jobPostId = input.required<string>();
  readonly numberOfOpenings = input(0);
  readonly rounds = input.required<import('@core/models/admin-job-post-model').InterviewRoundDto[]>();
  readonly canManageStages = input(false);
  /** Only fetch when the tab is active. */
  readonly active = input(false);

  // ── Board state ──
  readonly columnDefs: ColumnDef[] = BOARD_COLUMNS;
  readonly columns = signal<Map<ApplicationStatus, ApplicantListItemDto[]>>(new Map());
  readonly counts = signal<Map<ApplicationStatus, number>>(new Map());
  readonly isLoading = signal(false);

  readonly filterForm = this.fb.group({
    search: [''],
    source: this.fb.control<string | null>(null),
  });

  readonly sourceOptions = ['LinkedIn', 'Wuzzuf', 'Portal'].map((v) => ({ label: v, value: v }));

  readonly rejectedCount = computed(() =>
    REJECTED_FACETS.reduce((sum, s) => sum + (this.counts().get(s) ?? 0), 0),
  );

  // ── Card action menu ──
  cardMenuItems = signal<{ label: string; icon?: string; disabled?: boolean; tooltip?: string; command?: () => void }[]>([]);

  // ── Rejected drawer ──
  readonly rejectedVisible = signal(false);
  readonly rejectedItems = signal<ApplicantListItemDto[]>([]);
  readonly rejectedLoading = signal(false);

  protected readonly drawer = viewChild.required(ApplicantDetailDrawerComponent);
  private readonly scheduleDialog = viewChild.required(ScheduleInterviewDialogComponent);

  // ── Schedule interview context ──
  scheduleApplicantId: string | null = null;
  scheduleApplicantName = '';

  constructor() {
    effect(() => {
      if (this.active()) this.refreshBoard();
    });
  }

  /** Loads counts + all columns + the interview chip map. */
  refreshBoard(): void {
    if (!this.jobPostId()) return;
    this.isLoading.set(true);
    const v = this.filterForm.getRawValue();

    this.applicationsService.getCounts(this.jobPostId()).subscribe({
      next: (res) => {
        const map = new Map<ApplicationStatus, number>();
        for (const item of res.data ?? []) {
          map.set(item.status, item.count);
        }
        this.counts.set(map);
      },
      error: () => this.counts.set(new Map()),
    });

    // One request per column keeps each column independently paged/searchable.
    let pending = BOARD_COLUMNS.length;
    const result = new Map<ApplicationStatus, ApplicantListItemDto[]>();

    if (pending === 0) {
      this.isLoading.set(false);
      return;
    }

    for (const col of BOARD_COLUMNS) {
      const params: AdminApplicationsQueryParams = {
        JobPostId: this.jobPostId(),
        Status: col.status,
        Page: 1,
        PageSize: 50, // columns are capped; full paging lives in the Applicants tab
        Search: v.search?.trim() || undefined,
      };

      this.applicationsService.getList(params).subscribe({
        next: (res) => {
          result.set(col.status, res.data?.items ?? []);
          if (--pending === 0) {
            this.columns.set(result);
            this.isLoading.set(false);
          }
        },
        error: () => {
          result.set(col.status, []);
          if (--pending === 0) {
            this.columns.set(result);
            this.isLoading.set(false);
          }
        },
      });
    }

  }

  applyFilters(): void {
    this.refreshBoard();
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', source: null });
    this.refreshBoard();
  }

  cardsFor(status: ApplicationStatus): ApplicantListItemDto[] {
    return this.columns().get(status) ?? [];
  }

  countFor(status: ApplicationStatus): number {
    return this.counts().get(status) ?? 0;
  }

  candidateName(row: ApplicantListItemDto): string {
    return [row.candidateFirstName, row.candidateLastName].filter(Boolean).join(' ').trim() || 'Unknown';
  }

  initials(row: ApplicantListItemDto): string {
    return this.candidateName(row)
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  // ── Card menu (status-aware, guide §5.7) ──
  openCardMenu(row: ApplicantListItemDto, event: Event, menu: any): void {
    void event;
    const items: { label: string; icon?: string; disabled?: boolean; tooltip?: string; command?: () => void }[] = [];

    items.push({ label: 'View Profile', icon: 'pi pi-user', command: () => this.drawer().open(row.id) });

    if (!isTerminal(row.status)) {
      items.push({ label: 'Preview CV', icon: 'pi pi-eye', command: () => this.previewCv(row.id) });
      items.push({ label: 'Download CV', icon: 'pi pi-download', command: () => this.downloadCv(row.id) });

      if (this.canManageStages()) {
        if (row.status === ApplicationStatus.Shortlisted || row.status === ApplicationStatus.InterviewScheduled) {
          items.push({
            label: 'Schedule Interview',
            icon: 'pi pi-calendar-plus',
            command: () => this.openScheduleFor(row),
          });
          for (const target of nextStatuses(row.status)) {
            if (target === ApplicationStatus.Rejected || target === ApplicationStatus.Withdrawn || target === ApplicationStatus.InterviewScheduled) continue;
            items.push({
              label: humanizeEnum(target),
              icon: 'pi pi-arrow-right',
              command: () => this.moveCard(row, target),
            });
          }
        } else {
          for (const target of nextStatuses(row.status)) {
            if (target === ApplicationStatus.Rejected || target === ApplicationStatus.Withdrawn) continue;
            items.push({
              label: humanizeEnum(target),
              icon: 'pi pi-arrow-right',
              command: () => this.moveCard(row, target),
            });
          }
        }
        items.push({
          label: 'Reject…',
          icon: 'pi pi-ban',
          command: () => this.moveCard(row, ApplicationStatus.Rejected),
        });
        items.push({
          label: 'Withdraw',
          icon: 'pi pi-minus-circle',
          command: () => this.moveCard(row, ApplicationStatus.Withdrawn),
        });
      }
    }

    this.cardMenuItems.set(items);
    menu.toggle(event);
  }

  moveCard(row: ApplicantListItemDto, target: ApplicationStatus): void {
    if (!isValidTransition(row.status, target)) return;
    if (
      target === ApplicationStatus.Rejected &&
      !window.confirm(`Reject ${this.candidateName(row)}?`)
    ) {
      return;
    }

    this.isLoading.set(true);
    this.applicationsService.changeStatus(row.id, { status: target }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.refreshBoard();
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  // ── CV preview / download ──
  previewCv(applicationId: string): void {
    this.applicationsService.downloadResume(applicationId, true).subscribe({
      next: (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
    });
  }

  downloadCv(applicationId: string): void {
    this.applicationsService.downloadResume(applicationId).subscribe({
      next: (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${applicationId.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  // ── Schedule interview ──
  openScheduleFor(row: ApplicantListItemDto): void {
    this.scheduleApplicantId = row.id;
    this.scheduleApplicantName = this.candidateName(row);
    this.scheduleDialog().open();
  }

  onScheduled(event: { applicantId: string; roundId: string }): void {
    this.applicationsService.changeStatus(event.applicantId, {
      status: ApplicationStatus.InterviewScheduled,
    }).subscribe({
      next: () => this.refreshBoard(),
      error: () => this.refreshBoard(),
    });
  }

  // ── Rejected drawer (guide §5.2 "View Rejected") ──
  openRejectedDrawer(): void {
    this.rejectedVisible.set(true);
    this.rejectedLoading.set(true);
    this.rejectedItems.set([]);

    let pending = REJECTED_FACETS.length;
    const collected: ApplicantListItemDto[] = [];

    for (const status of REJECTED_FACETS) {
      this.applicationsService
        .getList({ JobPostId: this.jobPostId(), Status: status, Page: 1, PageSize: 100 })
        .subscribe({
          next: (res) => {
            collected.push(...(res.data?.items ?? []));
            if (--pending === 0) {
              this.rejectedItems.set(collected);
              this.rejectedLoading.set(false);
            }
          },
          error: () => {
            if (--pending === 0) {
              this.rejectedItems.set(collected);
              this.rejectedLoading.set(false);
            }
          },
        });
    }
  }

  protected readonly enumLabel = humanizeEnum;
}
