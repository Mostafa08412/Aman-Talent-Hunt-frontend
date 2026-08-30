import { Component, EventEmitter, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

import { InterviewService } from '@core/services/interview.service';
import { AdminEmployeesService } from '@core/services/admin-employees.service';
import { humanizeEnum } from './status-badge.component';
import {
  InterviewFormat,
  InterviewRoundDto,
  ScheduleInterviewRequest,
} from '@core/models';

/** A round is unselectable while it already has an active interview. */
export interface RoundOption {
  label: string;
  value: string;
  disabled: boolean;
}

@Component({
  selector: 'app-schedule-interview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './schedule-interview-dialog.component.html',
  styleUrl: './schedule-interview-dialog.component.scss',
})
export class ScheduleInterviewDialogComponent {
  private readonly interviewService = inject(InterviewService);
  private readonly employeesService = inject(AdminEmployeesService);
  private readonly fb = inject(FormBuilder);

  /** Rounds come from the job post detail DTO (`interviewRounds`). */
  readonly rounds = input.required<InterviewRoundDto[]>();
  readonly applicantId = input<string | null>(null);
  readonly applicantName = input<string>('');
  /**
   * Rounds that already have an active interview (id → occupied).
   * Surfaces the backend 409 duplicate guard before submission.
   */
  readonly occupiedRoundIds = input<Set<string>>(new Set());

  readonly visible = signal(false);
  readonly visibleChange = output<boolean>();
  /** Emits after `POST /api/interviews/schedule` succeeds; parent orchestrates the stage move. */
  readonly scheduled = output<{ applicantId: string; roundId: string; roundNumber: number | null }>();

  readonly submitting = signal(false);
  readonly interviewerLoading = signal(false);
  readonly interviewers = signal<{ id: string; viewText: string | null; secondaryText: string | null }[]>([]);

  readonly form = this.fb.group({
    roundId: this.fb.nonNullable.control<string>('', Validators.required),
    interviewerId: this.fb.nonNullable.control<string>('', Validators.required),
    scheduledDate: this.fb.control<Date | null>(null, Validators.required),
    meetingLink: this.fb.control<string | null>(null),
    locationDetails: this.fb.control<string | null>(null),
  });

  interviewerSearch = '';

  readonly minDate = new Date();

  private searchTimeout?: ReturnType<typeof setTimeout>;

  open(applicantId?: string): void {
    if (applicantId) {
      this.form.reset({
        roundId: '',
        interviewerId: '',
        scheduledDate: null,
        meetingLink: null,
        locationDetails: null,
      });
    }
    this.interviewers.set([]);
    this.visible.set(true);
    this.visibleChange.emit(true);
    this.loadInterviewers('');
  }

  close(): void {
    this.visible.set(false);
    this.visibleChange.emit(false);
  }

  cancel(): void {
    this.close();
  }

  readonly roundOptions = (): RoundOption[] =>
    this.rounds().map((r) => ({
      label: `${r.name ?? 'Round'} ${r.order}`,
      value: r.id,
      disabled: this.occupiedRoundIds().has(r.id),
    }));

  readonly selectedRound = () => this.rounds().find((r) => r.id === this.form.controls.roundId.value) ?? null;

  onRoundChange(): void {
    this.form.patchValue({ meetingLink: null, locationDetails: null });
  }

  requiresMeetingLink(): boolean {
    const fmt = this.selectedRound()?.format;
    return fmt === InterviewFormat.Video;
  }

  requiresLocation(): boolean {
    const fmt = this.selectedRound()?.format;
    return fmt === InterviewFormat.InPerson || fmt === InterviewFormat.Panel || fmt === InterviewFormat.Phone;
  }

  onInterviewerFilter(event: { filter?: string }): void {
    this.searchInterviewers(event.filter ?? '');
  }

  searchInterviewers(term: string): void {
    this.interviewerSearch = term;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (term.length < 2) {
      this.interviewers.set([]);
      return;
    }
    this.searchTimeout = setTimeout(() => this.loadInterviewers(term), 300);
  }

  private loadInterviewers(search: string): void {
    this.interviewerLoading.set(true);
    this.employeesService
      .getLookup({ Search: search || undefined, PageSize: 10 })
      .subscribe({
        next: (res) => {
          this.interviewers.set(res.data?.items ?? []);
          this.interviewerLoading.set(false);
        },
        error: () => {
          this.interviewers.set([]);
          this.interviewerLoading.set(false);
        },
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const applicantId = this.applicantId();
    if (!applicantId) return;

    const v = this.form.getRawValue();

    const request: ScheduleInterviewRequest = {
      interviewRoundId: v.roundId,
      interviewerId: v.interviewerId,
      applicantId,
      scheduledDate: v.scheduledDate!.toISOString(),
      meetingLink: v.meetingLink || undefined,
      locationDetails: v.locationDetails || undefined,
    };

    this.submitting.set(true);
    this.interviewService.schedule(request).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (!res.isCompletedSuccessfully) return;
        const round = this.selectedRound();
        this.scheduled.emit({
          applicantId,
          roundId: v.roundId,
          roundNumber: round?.order ?? null,
        });
        this.close();
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }

  protected readonly humanize = humanizeEnum;
}
