import { Component, effect, inject, input, signal, viewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { InterviewService } from '@core/services/interview.service';
import { AuthService } from '@core/services/auth.service';
import { Role } from '@core/models/role.model';
import {
  InterviewListItemDto,
  InterviewDetailDto,
  InterviewsQueryParams,
  RescheduleInterviewRequest,
  CancelInterviewRequest,
} from '@core/models/interview-model';
import { InterviewRoundDto } from '@core/models/admin-job-post-model';
import { InterviewFormat, InterviewStatus } from '@core/models/enums';

import { StatusBadgeComponent, humanizeEnum } from '../shared/status-badge.component';

interface EnumOption {
  label: string;
  value: string;
}

/**
 * Interviews tab (guide §7): paged table of interviews for this job post
 * with full lifecycle control — schedule / reschedule / cancel / result / view details.
 */
@Component({
  selector: 'app-interviews-tab',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MenuModule,
    DialogModule,
    DatePickerModule,
    InputTextarea,
    StatusBadgeComponent,
    ToastModule,
    TooltipModule,
  ],
  templateUrl: './interviews-tab.component.html',
  styleUrl: './interviews-tab.component.scss',
})
export class InterviewsTabComponent {
  private readonly interviewService = inject(InterviewService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly jobPostId = input.required<string>();
  readonly rounds = input.required<InterviewRoundDto[]>();
  /** Only fetch when the tab is active. */
  readonly active = input(false);

  // ── Permissions (guide §7 lifecycle actions) ──
  readonly canRescheduleOrCancel =
    this.authService.hasRole(Role.Recruiter) || this.authService.hasRole(Role.HRManager);

  // ── State ──
  readonly interviews = signal<InterviewListItemDto[]>([]);
  readonly isLoading = signal(false);
  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly pageSize = 10;

  readonly filterForm = this.fb.group({
    search: [''],
    status: this.fb.control<InterviewStatus | null>(null),
    format: this.fb.control<InterviewFormat | null>(null),
  });

  readonly statusOptions: EnumOption[] = Object.values(InterviewStatus).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));
  readonly formatOptions: EnumOption[] = Object.values(InterviewFormat).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));

  // ── Row action menu ──
  actionMenuItems = signal<{ label: string; icon?: string; disabled?: boolean; command?: () => void }[]>([]);

  // ── View-details dialog ──
  viewDialogVisible = false;
  viewTarget: InterviewDetailDto | null = null;
  viewLoading = false;

  // ── Reschedule dialog state ──
  rescheduleDialogVisible = false;
  rescheduleTarget: InterviewListItemDto | null = null;
  readonly minRescheduleDate = new Date();

  readonly rescheduleForm = this.fb.group({
    newDate: this.fb.control<Date | null>(null, Validators.required),
    meetingLink: this.fb.control<string | null>(null),
    locationDetails: this.fb.control<string | null>(null),
  });

  // ── Cancel dialog state ──
  cancelDialogVisible = false;
  cancelTarget: InterviewListItemDto | null = null;

  readonly cancelForm = this.fb.group({
    reason: this.fb.nonNullable.control<string>('', [Validators.required, Validators.minLength(1)]),
  });

  constructor() {
    effect(() => {
      if (this.active()) this.load();
    });
  }

  load(): void {
    if (!this.jobPostId()) return;
    this.isLoading.set(true);
    const v = this.filterForm.getRawValue();

    const params: InterviewsQueryParams = {
      JobPostId: this.jobPostId(),
      Page: this.page(),
      PageSize: this.pageSize,
      Search: v.search?.trim() || undefined,
      Status: v.status ?? undefined,
      Format: v.format ?? undefined,
    };

    this.interviewService.getList(params).subscribe({
      next: (res) => {
        this.interviews.set(res.data?.items ?? []);
        this.totalCount.set(res.data?.totalCount ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.interviews.set([]);
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
    this.filterForm.reset({ search: '', status: null, format: null });
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

  candidateName(row: InterviewListItemDto): string {
    return [row.candidateFirstName, row.candidateLastName].filter(Boolean).join(' ').trim() || 'Unknown';
  }

  roundLabel(row: InterviewListItemDto): string {
    return row.roundName ?? `Round ${row.roundNumber}`;
  }

  isPast(row: InterviewListItemDto): boolean {
    return !!row.scheduledDate && new Date(row.scheduledDate) <= new Date();
  }

  /** Status-aware row menu — full lifecycle control. */
  openRowMenu(row: InterviewListItemDto, event: Event, menu: any): void {
    const items: { label: string; icon?: string; disabled?: boolean; command?: () => void }[] = [];

    // ── View Details (always available) ──
    items.push({
      label: 'View Details',
      icon: 'pi pi-info-circle',
      command: () => this.openViewDetails(row),
    });

    // ── Scheduled / Rescheduled ──
    if (row.status === InterviewStatus.Scheduled || row.status === InterviewStatus.Rescheduled) {
      if (this.canRescheduleOrCancel) {
        items.push({
          label: 'Update Meeting Link',
          icon: 'pi pi-link',
          command: () => this.updateMeetingLink(row),
        });
        items.push({
          label: 'Reschedule…',
          icon: 'pi pi-calendar-plus',
          command: () => this.openReschedule(row),
        });
        items.push({
          label: 'Cancel…',
          icon: 'pi pi-times',
          command: () => this.openCancel(row),
        });
      }
    }

    // ── Completed ──
    if (row.status === InterviewStatus.Completed) {
      // No actions — result is immutable once submitted (ResultAlreadySubmited).
    }

    // ── Cancelled ──
    if (row.status === InterviewStatus.Cancelled) {
      if (this.canRescheduleOrCancel) {
        items.push({
          label: 'Re-schedule…',
          icon: 'pi pi-calendar-plus',
          command: () => this.openReschedule(row),
        });
      }
    }

    if (items.length === 1) {
      // Only View Details — no management actions
    } else if (items.length === 0) {
      items.push({ label: 'No actions available', disabled: true });
    }

    this.actionMenuItems.set(items);
    menu.toggle(event);
  }

  // ── Dialog refs ──

  // ── View details ──
  openViewDetails(row: InterviewListItemDto): void {
    this.viewLoading = true;
    this.viewTarget = null;
    this.viewDialogVisible = true;

    this.interviewService.getById(row.id).subscribe({
      next: (res) => {
        this.viewTarget = res.data ?? null;
        this.viewLoading = false;
      },
      error: () => {
        this.viewLoading = false;
      },
    });
  }

  viewDetailDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString([], {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  copyToClipboard(text: string | null): void {
    if (!text) return;
    navigator.clipboard.writeText(text);
  }

  // ── Update meeting link ──
  updateMeetingLink(row: InterviewListItemDto): void {
    const link = window.prompt('Meeting link or location details:');
    if (!link?.trim()) return;

    this.interviewService.updateMeetingLink(row.id, { meetingLink: link.trim() }).subscribe({
      next: () => this.load(),
    });
  }

  // ── Reschedule flow ──
  openReschedule(row: InterviewListItemDto): void {
    this.rescheduleTarget = row;
    this.rescheduleForm.reset({
      newDate: row.scheduledDate ? new Date(row.scheduledDate) : null,
      meetingLink: null,
      locationDetails: null,
    });
    this.rescheduleDialogVisible = true;
  }

  confirmReschedule(): void {
    const target = this.rescheduleTarget;
    if (!target || this.rescheduleForm.invalid) {
      this.rescheduleForm.markAllAsTouched();
      return;
    }
    const v = this.rescheduleForm.getRawValue();
    if (v.newDate!.getTime() <= Date.now()) {
      return;
    }

    const request: RescheduleInterviewRequest = {
      newDate: v.newDate!.toISOString(),
      meetingLink: v.meetingLink || undefined,
      locationDetails: v.locationDetails || undefined,
    };

    this.isLoading.set(true);
    this.interviewService.reschedule(target.id, request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.rescheduleDialogVisible = false;
        this.load();
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  // ── Cancel flow ──
  openCancel(row: InterviewListItemDto): void {
    this.cancelTarget = row;
    this.cancelForm.reset({ reason: '' });
    this.cancelDialogVisible = true;
  }

  confirmCancel(): void {
    const target = this.cancelTarget;
    if (!target || this.cancelForm.invalid) {
      this.cancelForm.markAllAsTouched();
      return;
    }

    const request: CancelInterviewRequest = { reason: this.cancelForm.getRawValue().reason.trim() };
    this.isLoading.set(true);
    this.interviewService.cancel(target.id, request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.cancelDialogVisible = false;
        this.load();
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  protected readonly enumLabel = humanizeEnum;
}
