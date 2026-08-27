import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { PaginatorModule } from 'primeng/paginator';
import { PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { AdminJobDescriptionsService } from '../../../core/services/admin-job-descriptions.service';
import { JobDescriptionListItemDto } from '../../../core/models/admin-job-description-model';
import { EmploymentType, JobDescriptionStatus } from '../../../core/models/enums';

@Component({
  selector: 'app-job-descriptions-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PaginatorModule,
    SelectModule,
    TableModule,
    TextareaModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './job-descriptions-list.component.html',
  styleUrl: './job-descriptions-list.component.scss',
})
export class JobDescriptionsListComponent {
  private readonly service = inject(AdminJobDescriptionsService);
  private readonly message = inject(MessageService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<JobDescriptionListItemDto[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly createVisible = signal(false);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly totalRecords = signal(0);
  readonly search = signal('');
  readonly selectedStatus = signal<JobDescriptionStatus | null>(null);

  readonly statuses = Object.values(JobDescriptionStatus).map((value) => ({ label: value, value }));
  readonly employmentTypes = Object.values(EmploymentType).map((value) => ({ label: value, value }));
  readonly createForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    summary: ['', Validators.required],
    responsibilities: ['', Validators.required],
    requirements: ['', Validators.required],
    employmentType: [null as EmploymentType | null, Validators.required],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getList({
      Status: this.selectedStatus() ?? undefined,
      Search: this.search().trim() || undefined,
      Page: this.page(),
      PageSize: this.pageSize(),
    }).subscribe({
      next: (response) => {
        this.items.set(response.data?.items ?? []);
        this.totalRecords.set(response.data?.totalCount ?? 0);
        this.loading.set(false);
      },
      error: (error) => {
        this.items.set([]);
        this.totalRecords.set(0);
        this.loading.set(false);
        this.showError(error, 'Unable to load job descriptions.');
      },
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.load();
  }

  onStatusChange(value: JobDescriptionStatus | null): void {
    this.selectedStatus.set(value);
    this.page.set(1);
    this.load();
  }

  onPageChange(event: PaginatorState): void {
    this.page.set((event.page ?? 0) + 1);
    this.pageSize.set(event.rows ?? this.pageSize());
    this.load();
  }

  openCreate(): void {
    this.createForm.reset({ title: '', summary: '', responsibilities: '', requirements: '', employmentType: null });
    this.createVisible.set(true);
  }

  create(): void {
    if (this.saving()) return;
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.createForm.getRawValue();
    this.service.create({
      title: value.title.trim(),
      summary: value.summary.trim(),
      responsibilities: value.responsibilities.trim(),
      requirements: value.requirements.trim(),
      employmentType: value.employmentType as EmploymentType,
    }).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.createVisible.set(false);
        this.message.add({ severity: 'success', summary: 'Created', detail: 'Job description created successfully.' });
        if (response.data) {
          this.router.navigate(['/console/admin/job-descriptions', response.data]);
        } else {
          this.load();
        }
      },
      error: (error) => {
        this.saving.set(false);
        this.showError(error, 'Unable to create job description.');
      },
    });
  }

  truncate(value: string | null, max = 90): string {
    if (!value) return '—';
    return value.length > max ? `${value.slice(0, max)}...` : value;
  }

  private showError(error: { error?: { message?: string } }, fallback: string): void {
    this.message.add({ severity: 'error', summary: 'Request Failed', detail: error?.error?.message || fallback });
  }
}
