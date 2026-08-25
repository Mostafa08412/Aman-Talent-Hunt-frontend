import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

import {
  AdminDepartmentsQueryParams,
  AdminDepartmentsService,
} from '../../../core/services/admin-departments.service';
import { AdminEmployeesService } from '../../../core/services/admin-employees.service';
import { AdminSquadsService } from '../../../core/services/admin-squads.service';

import { DepartmentListItemDto } from '../../../core/models/admin-department-model';
import { LookupItemDto } from '../../../core/models/lookup-model';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    DialogModule,
    InputTextModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.scss',
})
export class DepartmentsComponent implements OnInit {
  private readonly departmentsService = inject(AdminDepartmentsService);
  private readonly employeesService = inject(AdminEmployeesService);
  private readonly squadsService = inject(AdminSquadsService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly departments = signal<DepartmentListItemDto[]>([]);
  readonly squads = signal<LookupItemDto[]>([]);
  readonly employees = signal<LookupItemDto[]>([]);

  readonly isLoading = signal(false);
  readonly isCreating = signal(false);
  readonly totalCount = signal(0);

  search = '';
  squadFilter: string | null = null;

  private appliedSearch = '';
  private appliedSquad: string | null = null;

  readonly page = signal(1);
  readonly pageSize = 10;

  readonly createDialogVisible = signal(false);

  readonly createForm = this.fb.group({
    name: this.fb.nonNullable.control('', Validators.required),
    headEmployeeId: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.loadDepartments();
    this.loadLookups();
  }

  private loadLookups(): void {
    this.squadsService.getLookup().subscribe({
      next: (res) => {
        this.squads.set(
          res.isCompletedSuccessfully ? (res.data?.items ?? []) : [],
        );
      },
      error: () => this.squads.set([]),
    });

    this.employeesService.getLookup().subscribe({
      next: (res) => {
        this.employees.set(
          res.isCompletedSuccessfully ? (res.data?.items ?? []) : [],
        );
      },
      error: () => this.employees.set([]),
    });
  }

  loadDepartments(): void {
    this.isLoading.set(true);

    const params: AdminDepartmentsQueryParams = {
      Page: this.page(),
      PageSize: this.pageSize,
      Search: this.appliedSearch || undefined,
      SquadId: this.appliedSquad ?? undefined,
    };

    this.departmentsService.getList(params).subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
          this.departments.set([]);
          this.totalCount.set(0);
          this.isLoading.set(false);

          this.showError(res.message || 'Failed to load departments.');
          return;
        }

        this.departments.set(res.data?.items ?? []);
        this.totalCount.set(res.data?.totalCount ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.departments.set([]);
        this.totalCount.set(0);
        this.isLoading.set(false);
        this.showError('Failed to load departments.');
      },
    });
  }

  applyFilters(): void {
    this.appliedSearch = this.search.trim();
    this.appliedSquad = this.squadFilter;

    this.page.set(1);
    this.loadDepartments();
  }

  clearFilters(): void {
    this.search = '';
    this.squadFilter = null;

    this.applyFilters();
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.totalCount() / this.pageSize),
    );
  }

  get rangeStart(): number {
    if (this.totalCount() === 0) {
      return 0;
    }

    return (this.page() - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(
      this.page() * this.pageSize,
      this.totalCount(),
    );
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page();

    if (total <= 6) {
      return Array.from(
        { length: total },
        (_, index) => index + 1,
      );
    }

    const wanted = [
      current - 1,
      current,
      current + 1,
      total,
    ].filter(
      (pageNumber) =>
        pageNumber >= 1 && pageNumber <= total,
    );

    return [...new Set([1, ...wanted])].sort(
      (a, b) => a - b,
    );
  }

  goToPage(pageNumber: number): void {
    const clamped = Math.min(
      Math.max(1, pageNumber),
      this.totalPages,
    );

    if (clamped === this.page()) {
      return;
    }

    this.page.set(clamped);
    this.loadDepartments();
  }

  previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  openDepartment(department: DepartmentListItemDto): void {
    this.router.navigate([
      '/console/admin/departments',
      department.id,
    ]);
  }

  openCreateDialog(): void {
    this.createForm.reset({
      name: '',
      headEmployeeId: null,
    });

    this.createDialogVisible.set(true);
  }

  closeCreateDialog(): void {
    this.createDialogVisible.set(false);
  }

  createDepartment(): void {
    if (this.createForm.invalid || this.isCreating()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const name =
      this.createForm.controls.name.value.trim();

    if (!name) {
      this.createForm.controls.name.setErrors({
        required: true,
      });

      return;
    }

    this.isCreating.set(true);

    this.departmentsService
      .create({
        name,
        headEmployeeId:
          this.createForm.controls.headEmployeeId.value,
      })
      .subscribe({
        next: (res) => {
          this.isCreating.set(false);

          if (!res.isCompletedSuccessfully) {
            this.showError(
              res.message || 'Failed to create department.',
            );
            return;
          }

          this.createDialogVisible.set(false);

          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: 'Department created successfully.',
          });

          this.page.set(1);
          this.loadDepartments();
        },
        error: () => {
          this.isCreating.set(false);
          this.showError('Failed to create department.');
        },
      });
  }

  deleteDepartment(
    department: DepartmentListItemDto,
    event: MouseEvent,
  ): void {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete department "${department.name ?? 'Unnamed Department'}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.departmentsService
      .delete(department.id)
      .subscribe({
        next: (res) => {
          if (!res.isCompletedSuccessfully) {
            this.showError(
              res.message || 'Failed to delete department.',
            );
            return;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Department deleted successfully.',
          });

          if (
            this.departments().length === 1 &&
            this.page() > 1
          ) {
            this.page.set(this.page() - 1);
          }

          this.loadDepartments();
        },
        error: () =>
          this.showError('Failed to delete department.'),
      });
  }

  referenceCode(
    department: DepartmentListItemDto,
  ): string {
    return (
      department.referenceNumber ||
      department.id.slice(0, 8).toUpperCase()
    );
  }

  mappedSquadsLabel(
    department: DepartmentListItemDto,
  ): string {
    const squads = department.squads ?? [];

    if (squads.length === 0) {
      return '—';
    }

    const names = squads.map(
      (squad) => squad.name || 'Unnamed Squad',
    );

    if (names.length <= 2) {
      return names.join(', ');
    }

    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }

  private showError(detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail,
    });
  }
}