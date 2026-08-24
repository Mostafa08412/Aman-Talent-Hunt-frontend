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
import { SquadLookupDto } from '../../../core/models/admin-squad-model';
import { DepartmentLookupDto } from '../../../core/models/admin-department-model';
import { PositionRegistryLookupDto } from '../../../core/models/admin-position-model';
import { Roles } from '../../../core/models/enums';
import { toApiError, EmployeeErrors, SquadErrors, IdentityErrors } from '@core/errors';

interface RoleOption {
  value: Roles;
  title: string;
  description: string;
}

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

  departments = signal<DepartmentLookupDto[]>([]);
  squads = signal<SquadLookupDto[]>([]);
  positions = signal<PositionRegistryLookupDto[]>([]);

  isSubmitting = false;
  selectedRole = signal<Roles>(Roles.HRManager);

  readonly roleOptions: RoleOption[] = [
    {
      value: Roles.HRManager,
      title: 'HR Manager',
      description:
        'Full access to recruitment, manpower planning, and position registry.',
    },
    {
      value: Roles.Recruiter,
      title: 'Recruiter',
      description:
        'Can manage job postings, view candidates, and process applications.',
    },
    {
      value: Roles.DepartmentHead,
      title: 'Department Head',
      description:
        'Can view departmental requisitions and approve manpower requests.',
    },
    {
      value: Roles.HiringManager,
      title: 'Hiring Manager',
      description:
        'Can interview candidates and submit feedback for specific requisitions.',
    },
  ];

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
      next: (res) => this.departments.set(res.data ?? []),
      error: () => this.departments.set([]),
    });

    this.squadsService.getLookup().subscribe({
      next: (res) => this.squads.set(res.data ?? []),
      error: () => this.squads.set([]),
    });

    this.loadPositions();
  }

  loadPositions(): void {
    const departmentId = this.form.controls.departmentId.value || undefined;

    this.positionsService.getLookup(departmentId).subscribe({
      next: (res) => this.positions.set(res.data ?? []),
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
