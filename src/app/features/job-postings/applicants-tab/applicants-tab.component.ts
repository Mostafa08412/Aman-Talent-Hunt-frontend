import { Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MenuModule } from 'primeng/menu';

import {
  AdminApplicationsQueryParams,
  AdminApplicationsService,
} from '@core/services/admin-applications.service';
import { AuthService } from '@core/services/auth.service';
import { Role } from '@core/models/role.model';
import { ApplicantListItemDto } from '@core/models/admin-application-model';
import {
  ApplicationSource,
  ApplicationStatus,
  JobPostStatus,
} from '@core/models/enums';
import { isTerminal, isValidTransition, nextStatuses } from '@core/models/application-status-transitions';

import { StatusBadgeComponent, humanizeEnum } from '../shared/status-badge.component';
import { RelativeTimePipe } from '../shared/relative-time.pipe';
import { ApplicantDetailDrawerComponent } from '../shared/applicant-detail-drawer.component';
import { ScheduleInterviewDialogComponent } from '../shared/schedule-interview-dialog.component';

interface EnumOption {
  label: string;
  value: string;
}

/**
 * Applicants tab (guide §6): flat paged table over the same endpoint as the
 * Pipeline but without a status facet — used for bulk review.
 */
@Component({
  selector: 'app-applicants-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MenuModule,
    StatusBadgeComponent,
    RelativeTimePipe,
    ApplicantDetailDrawerComponent,
    ScheduleInterviewDialogComponent,
  ],
  templateUrl: './applicants-tab.component.html',
  styleUrl: './applicants-tab.component.scss',
})
export class ApplicantsTabComponent {
  private readonly applicationsService = inject(AdminApplicationsService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly jobPostId = input.required<string>();
  readonly postStatus = input.required<JobPostStatus>();
  readonly rounds = input.required<import('@core/models/admin-job-post-model').InterviewRoundDto[]>();
  readonly canManageStages = input(false);
  /** Only fetch when the tab is active. */
  readonly active = input(false);

  readonly applicants = signal<ApplicantListItemDto[]>([]);
  readonly isLoading = signal(false);
  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly pageSize = 10;

  readonly filterForm = this.fb.group({
    search: [''],
    source: this.fb.control<ApplicationSource | null>(null),
    status: this.fb.control<ApplicationStatus | null>(null),
  });

  readonly statusOptions: EnumOption[] = Object.values(ApplicationStatus).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));
  readonly sourceOptions: EnumOption[] = Object.values(ApplicationSource).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));

  rowMenuItems = signal<{ label: string; icon?: string; command?: () => void }[]>([]);

  private readonly drawer = viewChild.required(ApplicantDetailDrawerComponent);
  private readonly scheduleDialog = viewChild.required(ScheduleInterviewDialogComponent);

  // ── Schedule interview context ──
  scheduleApplicantId: string | null = null;
  scheduleApplicantName = '';

  /** Offer/hire actions are blocked once the post's openings are covered (guide §5.6). */
  readonly openingsFull = computed(() => this.postStatus() === JobPostStatus.Filled || this.postStatus() === JobPostStatus.Closed);

  constructor() {
    effect(() => {
      if (this.active()) this.load();
    });
  }

  load(): void {
    if (!this.jobPostId()) return;
    this.isLoading.set(true);
    const v = this.filterForm.getRawValue();

    const params: AdminApplicationsQueryParams = {
      JobPostId: this.jobPostId(),
      Page: this.page(),
      PageSize: this.pageSize,
      Search: v.search?.trim() || undefined,
      Source: v.source ?? undefined,
      Status: v.status ?? undefined,
    };

    this.applicationsService.getList(params).subscribe({
      next: (res) => {
        this.applicants.set(res.data?.items ?? []);
        this.totalCount.set(res.data?.totalCount ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.applicants.set([]);
        this.totalCount.set(0);
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', source: null, status: null });
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }

  get rangeStart(): number {
    return this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page() * this.pageSize, this.totalCount());
  }

  goToPage(pageNumber: number): void {
    const clamped = Math.min(Math.max(1, pageNumber), this.totalPages);
    if (clamped === this.page()) return;
    this.page.set(clamped);
    this.load();
  }

  candidateName(row: ApplicantListItemDto): string {
    return [row.candidateFirstName, row.candidateLastName].filter(Boolean).join(' ').trim() || 'Unknown';
  }

  openProfile(row: ApplicantListItemDto): void {
    this.drawer().open(row.id);
  }

  openRowMenu(row: ApplicantListItemDto, event: Event, menu: any): void {
    const items: { label: string; icon?: string; command?: () => void }[] = [
      { label: 'View Profile', icon: 'pi pi-user', command: () => this.drawer().open(row.id) },
      { label: 'Preview CV', icon: 'pi pi-eye', command: () => this.previewCv(row.id) },
      { label: 'Download CV', icon: 'pi pi-download', command: () => this.downloadCv(row.id) },
    ];

    if (this.canManageStages() && !isTerminal(row.status)) {
      if (row.status === ApplicationStatus.Shortlisted || row.status === ApplicationStatus.InterviewScheduled) {
        items.push({ label: 'Schedule Interview', icon: 'pi pi-calendar-plus', command: () => this.openScheduleFor(row) });
        for (const target of nextStatuses(row.status)) {
          if (target === ApplicationStatus.Rejected || target === ApplicationStatus.Withdrawn || target === ApplicationStatus.InterviewScheduled) continue;
          items.push({ label: humanizeEnum(target), icon: 'pi pi-arrow-right', command: () => this.changeStatus(row, target) });
        }
      } else {
        for (const target of nextStatuses(row.status)) {
          if (target === ApplicationStatus.Rejected || target === ApplicationStatus.Withdrawn) continue;
          items.push({ label: humanizeEnum(target), icon: 'pi pi-arrow-right', command: () => this.changeStatus(row, target) });
        }
      }
      items.push({ label: 'Reject…', icon: 'pi pi-ban', command: () => this.changeStatus(row, ApplicationStatus.Rejected) });
      items.push({ label: 'Withdraw', icon: 'pi pi-minus-circle', command: () => this.changeStatus(row, ApplicationStatus.Withdrawn) });
    }

    this.rowMenuItems.set(items);
    menu.toggle(event);
  }

  changeStatus(row: ApplicantListItemDto, status: ApplicationStatus): void {
    if (!isValidTransition(row.status, status)) return;

    if (status === ApplicationStatus.Rejected || status === ApplicationStatus.Withdrawn) {
      const confirmed = window.confirm(
        `${status === ApplicationStatus.Rejected ? 'Reject' : 'Withdraw'} ${this.candidateName(row)}? This cannot be undone.`,
      );
      if (!confirmed) return;
    }

    this.isLoading.set(true);
    this.applicationsService.changeStatus(row.id, { status }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.load();
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

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
      next: () => this.load(),
      error: () => this.load(),
    });
  }

  protected readonly enumLabel = humanizeEnum;
}
