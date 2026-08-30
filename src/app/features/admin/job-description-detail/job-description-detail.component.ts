import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { EditorModule } from 'primeng/editor';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { AdminJobDescriptionsService } from '../../../core/services/admin-job-descriptions.service';
import { AdminRequisitionsService } from '../../../core/services/admin-requisitions.service';
import { JobDescriptionDetailDto } from '../../../core/models/admin-job-description-model';
import { JobRequisitionListItemDto } from '../../../core/models/admin-requisition-model';
import { EmploymentType, JobDescriptionStatus } from '../../../core/models/enums';
import { richTextRequiredValidator } from '../../../shared/utils/rich-text.utils';

@Component({
  selector: 'app-job-description-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, ConfirmDialogModule, DialogModule, EditorModule, InputTextModule, ProgressSpinnerModule, SelectModule, TextareaModule],
  providers: [ConfirmationService],
  templateUrl: './job-description-detail.component.html',
  styleUrl: './job-description-detail.component.scss',
})
export class JobDescriptionDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminJobDescriptionsService);
  private readonly requisitionsService = inject(AdminRequisitionsService);
  private readonly message = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  readonly detail = signal<JobDescriptionDetailDto | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly operation = signal<string | null>(null);
  readonly editing = signal(false);
  readonly rejectVisible = signal(false);
  readonly attachVisible = signal(false);
  readonly requisitions = signal<JobRequisitionListItemDto[]>([]);
  readonly employmentTypes = Object.values(EmploymentType).map((value) => ({ label: value, value }));
  readonly editForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    summary: ['', Validators.required],
    responsibilities: ['', [Validators.required, richTextRequiredValidator()]],
    requirements: ['', [Validators.required, richTextRequiredValidator()]],
    employmentType: [null as EmploymentType | null, Validators.required],
  });
  readonly rejectForm = this.fb.nonNullable.group({ reason: ['', Validators.required] });
  readonly attachForm = this.fb.nonNullable.group({ requisitionId: ['', Validators.required] });

  readonly status = computed(() => this.detail()?.status ?? null);
  readonly canEdit = computed(() => this.status() === JobDescriptionStatus.Draft || this.status() === JobDescriptionStatus.Rejected);
  readonly canDelete = computed(() => this.status() === JobDescriptionStatus.Draft);
  readonly canSubmit = computed(() => this.status() === JobDescriptionStatus.Draft || this.status() === JobDescriptionStatus.Rejected);
  readonly canReview = computed(() => this.status() === JobDescriptionStatus.PendingApproval);
  readonly canAttach = computed(() => this.status() === JobDescriptionStatus.Approved);

  readonly statusStyle = computed(() => {
    switch (this.status()) {
      case JobDescriptionStatus.Approved:
        return { pillClass: 'pill-success', dotClass: 'dot-success' };
      case JobDescriptionStatus.PendingApproval:
        return { pillClass: 'pill-warning', dotClass: 'dot-warning' };
      case JobDescriptionStatus.Rejected:
        return { pillClass: 'pill-error', dotClass: 'dot-error' };
      default:
        return { pillClass: 'pill-draft', dotClass: 'dot-info' };
    }
  });

  statusLabel(): string {
    switch (this.status()) {
      case JobDescriptionStatus.PendingApproval:
        return 'Pending Approval';
      default:
        return this.status() ?? '—';
    }
  }

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    this.loading.set(true);
    this.service.getById(id).subscribe({
      next: (response) => {
        this.detail.set(response.data ?? null);
        this.error.set(!response.data);
        this.loading.set(false);
      },
      error: () => {
        this.detail.set(null);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  startEdit(): void {
    const value = this.detail();
    if (!value || !this.canEdit()) return;
    this.editForm.reset({
      title: value.title ?? '',
      summary: value.summary ?? '',
      responsibilities: value.responsibilities ?? '',
      requirements: value.requirements ?? '',
      employmentType: value.employmentType,
    });
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  update(): void {
    const id = this.id();
    if (!id || this.editForm.invalid || this.operation()) {
      this.editForm.markAllAsTouched();
      return;
    }
    const value = this.editForm.getRawValue();
    this.operation.set('update');
    this.service.update(id, { ...value, employmentType: value.employmentType as EmploymentType }).subscribe({
      next: (response) => this.finish(response.isCompletedSuccessfully, 'Job description updated successfully.', () => this.editing.set(false)),
      error: () => this.fail(),
    });
  }

  delete(): void {
    const id = this.id();
    if (!id || !this.canDelete() || this.operation()) return;
    this.confirmation.confirm({
      header: 'Delete Job Description',
      message: 'Are you sure you want to delete this draft job description?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.operation.set('delete');
        this.service.delete(id).subscribe({
          next: (response) => {
            this.operation.set(null);
            if (response.isCompletedSuccessfully) {
              this.message.add({ severity: 'success', summary: 'Deleted', detail: 'Job description deleted successfully.' });
              this.router.navigate(['/console/admin/job-descriptions']);
            } else this.fail();
          },
          error: () => this.fail(),
        });
      },
    });
  }

  submitForApproval(): void { this.runAction('submit', 'Job description submitted for approval.'); }
  approve(): void { this.runAction('approve', 'Job description approved successfully.'); }

  openReject(): void {
    this.rejectForm.reset({ reason: '' });
    this.rejectVisible.set(true);
  }

  reject(): void {
    if (this.rejectForm.invalid || this.operation()) { this.rejectForm.markAllAsTouched(); return; }
    this.runAction('reject', 'Job description rejected.', () => this.rejectVisible.set(false));
  }

  openAttach(): void {
    this.attachForm.reset({ requisitionId: '' });
    this.requisitionsService.getList({ Page: 1, PageSize: 100 }).subscribe({
      next: (response) => { this.requisitions.set(response.data?.items ?? []); this.attachVisible.set(true); },
      error: () => this.fail(),
    });
  }

  attach(): void {
    if (this.attachForm.invalid || this.operation()) { this.attachForm.markAllAsTouched(); return; }
    this.runAction('attach', 'Job description attached successfully.', () => this.attachVisible.set(false));
  }

  hasRichContent(value: string | null): boolean {
    return Boolean(value && value.trim().length > 0);
  }

  private id(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }

  private runAction(name: string, success: string, after?: () => void): void {
    const id = this.id();
    if (!id || this.operation()) return;
    this.operation.set(name);
    const request$ = name === 'submit' ? this.service.submit(id) : name === 'approve' ? this.service.approve(id) : name === 'reject' ? this.service.reject(id, this.rejectForm.getRawValue()) : this.service.attachToRequisition(id, this.attachForm.getRawValue());
    request$.subscribe({
      next: (response) => {
        this.operation.set(null);
        if (response.isCompletedSuccessfully) { after?.(); this.message.add({ severity: 'success', summary: 'Updated', detail: success }); this.load(); }
        else this.fail();
      },
      error: () => this.fail(),
    });
  }

  private finish(successful: boolean, successText: string, after?: () => void): void {
    this.operation.set(null);
    if (successful) { after?.(); this.message.add({ severity: 'success', summary: 'Updated', detail: successText }); this.load(); }
  }

  private fail(): void { this.operation.set(null); }
}
