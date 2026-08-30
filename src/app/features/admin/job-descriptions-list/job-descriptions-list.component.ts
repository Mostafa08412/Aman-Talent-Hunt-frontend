import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { EditorModule } from 'primeng/editor';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { AdminJobDescriptionsService } from '../../../core/services/admin-job-descriptions.service';
import { JobDescriptionListItemDto } from '../../../core/models/admin-job-description-model';
import { EmploymentType, JobDescriptionStatus } from '../../../core/models/enums';
import { richTextRequiredValidator } from '../../../shared/utils/rich-text.utils';

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
    EditorModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
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

  searchValue = '';

  readonly statuses = Object.values(JobDescriptionStatus).map((value) => ({ label: value, value }));
  readonly employmentTypes = Object.values(EmploymentType).map((value) => ({ label: value, value }));
  readonly createForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    summary: ['', Validators.required],
    responsibilities: ['', [Validators.required, richTextRequiredValidator()]],
    requirements: ['', [Validators.required, richTextRequiredValidator()]],
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
      error: () => {
        this.items.set([]);
        this.totalRecords.set(0);
        this.loading.set(false);
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

  openItem(item: JobDescriptionListItemDto): void {
    this.router.navigate(['/console/admin/job-descriptions', item.id]);
  }

  statusKey(status: JobDescriptionStatus): string {
    return status.toLowerCase();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords() / this.pageSize()));
  }

  get pageRangeStart(): number {
    return this.totalRecords() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1;
  }

  get pageRangeEnd(): number {
    return Math.min(this.page() * this.pageSize(), this.totalRecords());
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page();
    if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
    const wanted = [current - 1, current, current + 1, total].filter(
      (p) => p >= 1 && p <= total,
    );
    return [...new Set([1, ...wanted])].sort((a, b) => a - b);
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages);
    if (clamped === this.page()) return;
    this.page.set(clamped);
    this.load();
  }

  previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
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
      error: () => {
        this.saving.set(false);
      },
    });
  }

  truncate(value: string | null, max = 90): string {
    if (!value) return '—';
    return value.length > max ? `${value.slice(0, max)}...` : value;
  }
}
