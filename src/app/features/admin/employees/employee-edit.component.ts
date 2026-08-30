import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

import { AdminEmployeesService } from '../../../core/services/admin-employees.service';
import { AdminSquadsService } from '../../../core/services/admin-squads.service';
import { AdminPositionsService } from '../../../core/services/admin-positions.service';
import { AdminDepartmentsService } from '../../../core/services/admin-departments.service';
import { EmployeeResponse } from '../../../core/models/admin-employee-model';
import { LookupItemDto } from '../../../core/models/lookup-model';
import { toApiError, EmployeeErrors } from '@core/errors';

@Component({
  selector: 'app-employee-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    InputTextModule,
  ],
  templateUrl: './employee-edit.component.html',
  styleUrl: './employee-edit.component.scss',
})
export class EmployeeEditComponent implements OnInit {
  private readonly employeesService = inject(AdminEmployeesService);
  private readonly squadsService = inject(AdminSquadsService);
  private readonly positionsService = inject(AdminPositionsService);
  private readonly departmentsService = inject(AdminDepartmentsService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  /** Route param bound via withComponentInputBinding (must match the :id param name). */
  readonly id = input.required<string>();
  readonly employee = signal<EmployeeResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly isMarkingDeparting = signal(false);
  readonly isUndoingDeparting = signal(false);

  readonly departments = signal<LookupItemDto[]>([]);
  readonly squads = signal<LookupItemDto[]>([]);
  readonly positions = signal<LookupItemDto[]>([]);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [{ value: '', disabled: true }],
    phoneNumber: [''],
    departmentId: [{ value: '', disabled: true }],
    positionRegistryId: ['', Validators.required],
    squadId: [{ value: null as string | null, disabled: true }],
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      this.router.navigate(['/console/admin/employees']);
      return;
    }
    this.loadLookups();
    this.loadEmployee(id);
  }

  private loadLookups(): void {
    this.departmentsService.getLookup().subscribe({
      next: (res) => this.departments.set(res.data?.items ?? []),
      error: () => this.departments.set([]),
    });
    this.squadsService.getLookup().subscribe({
      next: (res) => this.squads.set(res.data?.items ?? []),
      error: () => this.squads.set([]),
    });
  }

  private loadEmployee(id: string): void {
    this.isLoading.set(true);
    this.employeesService.getById(id).subscribe({
      next: (res) => {
        const employee = res.data ?? null;
        this.employee.set(employee);
        if (employee) {
          this.form.patchValue({
            firstName: employee.firstName ?? '',
            lastName: employee.lastName ?? '',
            email: employee.email ?? '',
            phoneNumber: employee.phoneNumber ?? '',
            positionRegistryId: employee.positionRegistryId,
            squadId: employee.squadId,
          });
          this.loadDepartmentAndPositions(employee.positionRegistryId);
        }
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const { title } = toApiError(err);
        if (title === EmployeeErrors.NotFound) {
          this.router.navigate(['/console/admin/employees']);
        }
      },
    });
  }

  /** Resolve the department from the current position, then load its positions list. */
  private loadDepartmentAndPositions(positionRegistryId: string): void {
    this.positionsService.getById(positionRegistryId).subscribe({
      next: (res) => {
        const departmentId = res.data?.departmentId ?? '';
        this.form.patchValue({ departmentId });
        this.loadPositions(departmentId || undefined);
      },
      error: () => this.loadPositions(),
    });
  }

  private loadPositions(departmentId?: string): void {
    this.positionsService.getLookup({ departmentId }).subscribe({
      next: (res) => this.positions.set(res.data?.items ?? []),
      error: () => this.positions.set([]),
    });
  }

  onDepartmentChanged(): void {
    // Positions depend on the selected department — reset and reload them.
    this.form.controls.positionRegistryId.reset();
    this.loadPositions(this.form.controls.departmentId.value || undefined);
  }

  toggleEdit(): void {
    if (this.isEditing()) {
      // Cancel — restore saved values and leave edit mode.
      const employee = this.employee();
      if (employee) {
        this.form.patchValue({
          firstName: employee.firstName ?? '',
          lastName: employee.lastName ?? '',
          phoneNumber: employee.phoneNumber ?? '',
          positionRegistryId: employee.positionRegistryId,
          squadId: employee.squadId,
        });
        this.loadDepartmentAndPositions(employee.positionRegistryId);
      }
      this.form.disable();
      this.isEditing.set(false);
    } else {
      // Email stays locked; the rest opens up.
      this.form.enable();
      this.form.get('email')?.disable();
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
    this.employeesService
      .update(this.id(), {
        firstName: value.firstName,
        lastName: value.lastName,
        phoneNumber: value.phoneNumber,
        positionRegistryId: value.positionRegistryId,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.isEditing.set(false);
          this.form.disable();
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Employee updated successfully.',
          });
          this.loadEmployee(this.id());
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          const { title } = toApiError(err);

          switch (title) {
            case EmployeeErrors.NotFound:
              this.router.navigate(['/console/admin/employees']);
              break;

            case EmployeeErrors.PositionNotFound:
              this.form.controls.positionRegistryId.setErrors({ invalidPosition: true });
              break;

            default:
              break;
          }
        },
      });
  }

  back(): void {
    this.router.navigate(['/console/admin/employees']);
  }

  markDeparting(): void {
    if (this.isMarkingDeparting() || this.employee()?.isDeparting) return;
    this.isMarkingDeparting.set(true);
    this.employeesService.markDeparting(this.id()).subscribe({
      next: () => {
        this.isMarkingDeparting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Marked as departing',
          detail: 'Employee marked as departing successfully.',
        });
        this.loadEmployee(this.id());
      },
      error: (err: HttpErrorResponse) => {
        this.isMarkingDeparting.set(false);
        const { title } = toApiError(err);
        if (title === EmployeeErrors.NotFound) {
          this.router.navigate(['/console/admin/employees']);
          return;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Action failed',
          detail: 'Unable to mark the employee as departing. Please try again.',
        });
      },
    });
  }

  undoDeparting(): void {
    if (this.isUndoingDeparting() || !this.employee()?.isDeparting) return;
    this.isUndoingDeparting.set(true);
    this.employeesService.undoDeparting(this.id()).subscribe({
      next: () => {
        this.isUndoingDeparting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Departing undone',
          detail: 'Employee is no longer marked as departing.',
        });
        this.loadEmployee(this.id());
      },
      error: (err: HttpErrorResponse) => {
        this.isUndoingDeparting.set(false);
        const { title } = toApiError(err);
        if (title === EmployeeErrors.NotFound) {
          this.router.navigate(['/console/admin/employees']);
          return;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Action failed',
          detail: 'Unable to undo the departing status. Please try again.',
        });
      },
    });
  }
}
