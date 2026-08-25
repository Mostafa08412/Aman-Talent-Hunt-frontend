import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { AdminPositionsService } from '../../../core/services/admin-positions.service';
import { AdminDepartmentsService } from '../../../core/services/admin-departments.service';
import { AdminJobDescriptionsService } from '../../../core/services/admin-job-descriptions.service';
import { PositionRegistryResponse } from '../../../core/models/admin-position-model';
import { LookupItemDto } from '../../../core/models/lookup-model';
import { SeniorityLevel, JobDescriptionStatus } from '../../../core/models/enums';

interface SeniorityOption {
  label: string;
  value: SeniorityLevel;
}

@Component({
  selector: 'app-position-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './position-edit.component.html',
  styleUrl: './position-edit.component.scss',
})
export class PositionEditComponent implements OnInit {
  private readonly positionsService = inject(AdminPositionsService);
  private readonly departmentsService = inject(AdminDepartmentsService);
  private readonly jobDescriptionsService = inject(AdminJobDescriptionsService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly confirmService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  /** Route param bound via withComponentInputBinding (must match the :id param name). */
  readonly id = input.required<string>();

  readonly position = signal<PositionRegistryResponse | null>(null);
  readonly isLoading = signal(true);
  readonly loadFailed = signal(false);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly isStatusPending = signal(false);
  readonly isDeleting = signal(false);

  readonly departments = signal<LookupItemDto[]>([]);
  readonly jobDescriptions = signal<LookupItemDto[]>([]);

  readonly seniorityOptions: SeniorityOption[] = [
    { label: 'Intern', value: SeniorityLevel.Intern },
    { label: 'Fresh', value: SeniorityLevel.Fresh },
    { label: 'Junior', value: SeniorityLevel.Junior },
    { label: 'Senior', value: SeniorityLevel.Senior },
  ];

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    departmentId: ['', Validators.required],
    seniorityLevel: [null as SeniorityLevel | null, Validators.required],
    jobDescriptionId: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      this.router.navigate(['/console/admin/positions']);
      return;
    }
    this.form.disable();
    this.loadLookups();
    this.loadPosition(id);
  }

  private loadLookups(): void {
    this.departmentsService.getLookup().subscribe({
      next: (res) => this.departments.set(res.data?.items ?? []),
      error: () => this.departments.set([]),
    });
    this.jobDescriptionsService.getLookup({}).subscribe({
      next: (res) => this.jobDescriptions.set(res.data?.items ?? []),
      error: () => this.jobDescriptions.set([]),
    });
  }

  private loadPosition(id: string): void {
    this.isLoading.set(true);
    this.loadFailed.set(false);
    this.positionsService.getById(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (!res.isCompletedSuccessfully || !res.data) {
          this.loadFailed.set(true);
          this.messageService.add({
            severity: 'error',
            summary: 'Not Found',
            detail: res.message || 'Position not found.',
          });
          return;
        }
        const position = res.data;
        this.position.set(position);
        this.patchForm(position);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loadFailed.set(true);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to load position.',
        });
      },
    });
  }

  private patchForm(position: PositionRegistryResponse): void {
    this.form.patchValue({
      title: position.title ?? '',
      departmentId: position.departmentId,
      seniorityLevel: position.seniorityLevel,
      jobDescriptionId: position.jobDescriptionId,
    });
  }

  levelLabel(level: SeniorityLevel): string {
    switch (level) {
      case SeniorityLevel.Intern:
        return 'L1 · Intern';
      case SeniorityLevel.Fresh:
        return 'L2 · Fresh';
      case SeniorityLevel.Junior:
        return 'L3 · Junior';
      case SeniorityLevel.Senior:
        return 'L4 · Senior';
      default:
        return level;
    }
  }

  toggleEdit(): void {
    if (this.isEditing()) {
      // Cancel — restore saved values and leave edit mode.
      const position = this.position();
      if (position) this.patchForm(position);
      this.form.disable();
      this.isEditing.set(false);
    } else {
      this.form.enable();
      this.isEditing.set(true);
    }
  }

  save(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const value = this.form.getRawValue();

    this.positionsService
      .update(this.id(), {
        title: value.title.trim(),
        departmentId: value.departmentId,
        jobDescriptionId: value.jobDescriptionId,
        seniorityLevel: value.seniorityLevel as SeniorityLevel,
      })
      .subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (!res.isCompletedSuccessfully) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: res.message || 'Failed to update position.',
            });
            return;
          }
          this.isEditing.set(false);
          this.form.disable();
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Position updated successfully.',
          });
          this.loadPosition(this.id());
        },
        error: (err) => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to update position.',
          });
        },
      });
  }

  /* ── Status ── */

  confirmToggleStatus(): void {
    const position = this.position();
    if (!position) return;
    const nextActive = !position.isActive;
    this.confirmService.confirm({
      message: nextActive
        ? `Reactivate position "${position.title}"?`
        : `Deactivate position "${position.title}"? It will no longer be usable for new hires.`,
      header: nextActive ? 'Activate Position' : 'Deactivate Position',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: nextActive ? undefined : 'p-button-danger',
      accept: () => this.changeStatus(nextActive),
    });
  }

  private changeStatus(nextActive: boolean): void {
    if (this.isStatusPending()) return;
    this.isStatusPending.set(true);

    this.positionsService.changeStatus(this.id(), { isActive: nextActive }).subscribe({
      next: (res) => {
        this.isStatusPending.set(false);
        if (!res.isCompletedSuccessfully) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'Failed to update position status.',
          });
          return;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Status Updated',
          detail: `Position is now ${nextActive ? 'Active' : 'Inactive'}.`,
        });
        this.loadPosition(this.id());
      },
      error: (err) => {
        this.isStatusPending.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to update position status.',
        });
      },
    });
  }

  /* ── Delete ── */

  confirmDelete(): void {
    const position = this.position();
    if (!position) return;
    this.confirmService.confirm({
      message: `Delete position "${position.title}"? This position will be removed from the registry.`,
      header: 'Delete Position',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deletePosition(),
    });
  }

  private deletePosition(): void {
    if (this.isDeleting()) return;
    this.isDeleting.set(true);

    this.positionsService.delete(this.id()).subscribe({
      next: (res) => {
        this.isDeleting.set(false);
        if (!res.isCompletedSuccessfully) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'Failed to delete position.',
          });
          return;
        }
        this.messageService.add({
          severity: 'warn',
          summary: 'Deleted',
          detail: 'Position removed.',
        });
        this.router.navigate(['/console/admin/positions']);
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to delete position.',
        });
      },
    });
  }

  back(): void {
    this.router.navigate(['/console/admin/positions']);
  }
}
