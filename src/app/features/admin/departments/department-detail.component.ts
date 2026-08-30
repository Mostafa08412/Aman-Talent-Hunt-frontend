import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { AdminDepartmentsService } from '../../../core/services/admin-departments.service';
import { AdminEmployeesService } from '../../../core/services/admin-employees.service';

import { DepartmentResponse } from '../../../core/models/admin-department-model';
import { LookupItemDto } from '../../../core/models/lookup-model';
import { Roles } from '../../../core/models/enums';

@Component({
  selector: 'app-department-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './department-detail.component.html',
  styleUrl: './department-detail.component.scss',
})
export class DepartmentDetailComponent implements OnInit {
  private readonly departmentsService =
    inject(AdminDepartmentsService);

  private readonly employeesService =
    inject(AdminEmployeesService);

  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly id = input.required<string>();

  readonly department = signal<DepartmentResponse | null>(
    null,
  );

  readonly employees = signal<LookupItemDto[]>([]);

  readonly isLoading = signal(true);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control(
      '',
      Validators.required,
    ),

    headEmployeeId:
      this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.form.disable();

    this.loadEmployees();
    this.loadDepartment();
  }

  private loadEmployees(): void {
    this.employeesService
      .getLookup({ role: Roles.DepartmentHead, PageSize: 100 })
      .subscribe({
        next: (res) => {
          this.employees.set(
            res.isCompletedSuccessfully
              ? (res.data?.items ?? [])
              : [],
          );
        },

        error: () => this.employees.set([]),
      });
  }

  private loadDepartment(): void {
    this.isLoading.set(true);

    this.departmentsService
      .getById(this.id())
      .subscribe({
        next: (res) => {
          if (
            !res.isCompletedSuccessfully ||
            !res.data
          ) {
            this.isLoading.set(false);

            return;
          }

          this.department.set(res.data);

          this.patchForm(res.data);

          this.form.disable();
          this.isEditing.set(false);
          this.isLoading.set(false);
        },

        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private patchForm(
    department: DepartmentResponse,
  ): void {
    this.form.patchValue({
      name: department.name ?? '',
      headEmployeeId:
        department.headEmployeeId ?? null,
    });
  }

  toggleEdit(): void {
    if (this.isEditing()) {
      const department = this.department();

      if (department) {
        this.patchForm(department);
      }

      this.form.disable();
      this.isEditing.set(false);

      return;
    }

    this.form.enable();
    this.isEditing.set(true);
  }

  save(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.controls.name.value.trim();

    if (!name) {
      this.form.controls.name.setErrors({
        required: true,
      });

      return;
    }

    this.isSaving.set(true);

    this.departmentsService
      .update(this.id(), {
        name,
        headEmployeeId:
          this.form.controls.headEmployeeId.value,
      })
      .subscribe({
        next: (res) => {
          this.isSaving.set(false);

          if (!res.isCompletedSuccessfully) {
            return;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Department updated successfully.',
          });

          this.isEditing.set(false);
          this.form.disable();

          this.loadDepartment();
        },

        error: () => {
          this.isSaving.set(false);
        },
      });
  }

  deleteDepartment(): void {
    if (this.isDeleting()) {
      return;
    }

    const name =
      this.department()?.name ?? 'this department';

    const confirmed = window.confirm(
      `Delete "${name}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(true);

    this.departmentsService
      .delete(this.id())
      .subscribe({
        next: (res) => {
          this.isDeleting.set(false);

          if (!res.isCompletedSuccessfully) {
            return;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Department deleted successfully.',
          });

          this.router.navigate([
            '/console/admin/departments',
          ]);
        },

        error: () => {
          this.isDeleting.set(false);
        },
      });
  }

  back(): void {
    this.router.navigate([
      '/console/admin/departments',
    ]);
  }
}