import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

import {
  AdminJobPostsService,
} from '@core/services/admin-job-posts.service';
import {
  AdminRequisitionsService,
} from '@core/services/admin-requisitions.service';
import { LookupItemDto } from '@core/models/lookup-model';
import {
  CreateJobPostRequest,
} from '@core/models/admin-job-post-model';
import {
  JobType,
  PostingVisibility,
} from '@core/models/enums';
import { humanizeEnum } from './shared/status-badge.component';

interface EnumOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-create-job-post-dialog',
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
  templateUrl: './create-job-post-dialog.component.html',
  styleUrl: './create-job-post-dialog.component.scss',
})
export class CreateJobPostDialogComponent {
  private readonly jobPostsService = inject(AdminJobPostsService);
  private readonly requisitionsService = inject(AdminRequisitionsService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly visible = model(false);
  /** Emits the new post's id so the parent can navigate to the detail page. */
  readonly created = output<string>();

  readonly creating = signal(false);
  readonly reqLoading = signal(false);
  readonly requisitions = signal<LookupItemDto[]>([]);

  reqSearchTerm = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;
  private lastSearchTerm = '';

  readonly minDate = new Date();

  readonly jobTypeOptions: EnumOption[] = Object.values(JobType).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));

  readonly visibilityOptions: EnumOption[] = Object.values(PostingVisibility).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));

  readonly form = this.fb.group({
    requisitionId: this.fb.nonNullable.control<string>('', Validators.required),
    jobType: this.fb.nonNullable.control<JobType>(JobType.OnSite, Validators.required),
    numberOfOpenings: this.fb.nonNullable.control<number>(1, [
      Validators.required,
      Validators.min(1),
    ]),
    visibility: this.fb.nonNullable.control<PostingVisibility>(PostingVisibility.Public, Validators.required),
    deadline: this.fb.control<Date | null>(null),
  });

  selectedRequisition(): LookupItemDto | null {
    return this.requisitions().find((r) => r.id === this.form.controls.requisitionId.value) ?? null;
  }

  onRequisitionChange(): void {
    // Selection handled via selectedRequisitionId binding.
  }

  /** Reset the form every time the dialog opens (parent toggles the visible input). */
  constructor() {
    effect(() => {
      if (this.visible()) this.resetForm();
    });
  }

  private resetForm(): void {
    this.form.reset({
      requisitionId: '',
      jobType: JobType.OnSite,
      numberOfOpenings: 1,
      visibility: PostingVisibility.Public,
      deadline: null,
    });
    this.requisitions.set([]);
    this.reqSearchTerm = '';
    this.lastSearchTerm = '';
  }

  cancel(): void {
    this.visible.set(false);
  }

  onVisibleChange(v: boolean): void {
    this.visible.set(v);
  }

  onRequisitionFilter(event: { filter?: string }): void {
    this.searchRequisitions(event.filter ?? '');
  }

  /** Debounced lookup against the Approved-requisitions feed (guide §3). */
  searchRequisitions(term: string): void {
    this.reqSearchTerm = term;
    const trimmed = term.trim();

    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (trimmed.length < 2) {
      if (this.lastSearchTerm.length >= 2) {
        // Clear results once the user drops below the minimum length.
        this.requisitions.set([]);
        this.lastSearchTerm = '';
      }
      return;
    }

    this.searchTimeout = setTimeout(() => this.loadRequisitions(trimmed), 300);
  }

  private loadRequisitions(search: string): void {
    this.reqLoading.set(true);
    this.lastSearchTerm = search;
    this.requisitionsService.getLookup({ Search: search, Page: 1, PageSize: 20 }).subscribe({
      next: (res) => {
        this.requisitions.set(res.data?.items ?? []);
        this.reqLoading.set(false);
      },
      error: () => {
        this.requisitions.set([]);
        this.reqLoading.set(false);
      },
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing information',
        detail: 'Please pick a requisition and complete all required fields.',
      });
      return;
    }

    const v = this.form.getRawValue();

    const request: CreateJobPostRequest = {
      jobRequisitionId: v.requisitionId,
      jobType: v.jobType,
      numberOfOpenings: v.numberOfOpenings,
      visibility: v.visibility,
      deadline: v.deadline ? v.deadline.toISOString() : null,
    };

    this.creating.set(true);
    this.jobPostsService.createFromRequisition(request.jobRequisitionId, request).subscribe({
      next: (res) => {
        this.creating.set(false);
        if (!res.data) return;
        this.created.emit(res.data.id);
      },
      error: () => {
        this.creating.set(false);
      },
    });
  }
}
