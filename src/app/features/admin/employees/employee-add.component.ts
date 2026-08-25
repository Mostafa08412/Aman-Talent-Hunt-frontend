import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AdminEmployeesService } from '../../../core/services/admin-employees.service';
import { AdminSquadsService } from '../../../core/services/admin-squads.service';
import { AdminPositionsService } from '../../../core/services/admin-positions.service';
import { AdminDepartmentsService } from '../../../core/services/admin-departments.service';
import { LookupItemDto } from '../../../core/models/lookup-model';
import { Roles } from '../../../core/models/enums';
import { toApiError, EmployeeErrors, SquadErrors, IdentityErrors } from '@core/errors';
import { ROLE_DEFINITIONS } from '../../../core/roles/roles';

@Component({
  selector: 'app-employee-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './employee-add.component.html',
  styleUrl: './employee-add.component.scss',
})
export class EmployeeAddComponent implements OnInit {
  private readonly employeesService = inject(AdminEmployeesService);
  private readonly squadsService = inject(AdminSquadsService);
  private readonly positionsService = inject(AdminPositionsService);
  private readonly departmentsService = inject(AdminDepartmentsService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  departments = signal<LookupItemDto[]>([]);
  squads = signal<LookupItemDto[]>([]);
  positions = signal<LookupItemDto[]>([]);

  isSubmitting = false;
  selectedRole = signal<Roles>(Roles.HRManager);

  readonly roleOptions = ROLE_DEFINITIONS.filter(
    (r) => r.value !== Roles.SuperAdmin,
  );

  readonly roles = Roles;

  // FormBuilder usage
  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    departmentId: ['', Validators.required],
    positionRegistryId: ['', Validators.required],
    squadId: [null as string | null],
  });

  positionPlaceholder = computed(() => 'Search positions...');

  ngOnInit(): void {
    this.departmentsService.getLookup().subscribe({
      next: (res) => this.departments.set(res.data?.items ?? []),
      error: () => this.departments.set([]),
    });

    this.squadsService.getLookup().subscribe({
      next: (res) => this.squads.set(res.data?.items ?? []),
      error: () => this.squads.set([]),
    });

    this.loadPositions();
  }

  loadPositions(): void {
    const departmentId = this.form.controls.departmentId.value || undefined;

    this.positionsService.getLookup({ departmentId }).subscribe({
      next: (res) => this.positions.set(res.data?.items ?? []),
      error: () => this.positions.set([]),
    });
  }

  onDepartmentChanged(): void {
    // Positions depend on the selected department — reset and reload them.
    this.form.controls.positionRegistryId.reset();
    this.loadPositions();
  }

  selectRole(role: Roles): void {
    this.selectedRole.set(role);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const value = this.form.getRawValue();

    const request = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phoneNumber: value.phoneNumber,
      positionRegistryId: value.positionRegistryId,
      squadId: value.squadId,
      role: this.selectedRole(),
    };

    this.employeesService.create(request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Created',
          detail: 'Employee created successfully.',
        });
        this.router.navigate(['/console/admin/employees']);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        const { title, detail } = toApiError(err);

        switch (title) {
          case EmployeeErrors.DuplicateEmail:
          case IdentityErrors.EmailAlreadyExists:
          case IdentityErrors.UserAlreadyExists:
            this.form.controls.email.setErrors({ taken: true });
            break;

          case EmployeeErrors.PositionNotFound:
            this.form.controls.positionRegistryId.setErrors({ invalidPosition: true });
            break;

          case SquadErrors.NotFound:
            this.form.controls.squadId.setErrors({ invalidSquad: true });
            break;

          default:
            this.messageService.add({ severity: 'error', summary: 'Error', detail });
        }
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/console/admin/employees']);
  }
}
