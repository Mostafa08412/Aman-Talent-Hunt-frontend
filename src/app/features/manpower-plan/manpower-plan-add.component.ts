import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AdminManpowerPlansService } from '../../core/services/admin-manpower-plans.service';
import { AdminDepartmentsService } from '../../core/services/admin-departments.service';
import { AdminPositionsService } from '../../core/services/admin-positions.service';
import { DepartmentLookupDto } from '../../core/models/admin-department-model';
import { PositionRegistryLookupDto } from '../../core/models/admin-position-model';
import { CreateManPowerPlanRequest } from '../../core/models/admin-manpower-plan-model';
import { PlanQuarter, SeniorityLevel } from '../../core/models/enums';
import { firstValueFrom } from 'rxjs';

type PositionMode = 'existing' | 'adhoc';

interface PeriodOption {
  label: string;
  fiscalYear: number;
  quarter: PlanQuarter;
}

function headcountValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return Number(value) >= 1 ? null : { min: true };
}

@Component({
  selector: 'app-manpower-plan-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './manpower-plan-add.component.html',
  styleUrl: './manpower-plan-add.component.scss',
})
export class ManpowerPlanAddComponent {
  private readonly plansService = inject(AdminManpowerPlansService);
  private readonly departmentsService = inject(AdminDepartmentsService);
  private readonly positionsService = inject(AdminPositionsService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  departments = signal<DepartmentLookupDto[]>([]);
  positions = signal<PositionRegistryLookupDto[]>([]);

  positionMode = signal<PositionMode>('existing');
  isSubmitting = signal(false);

  readonly seniorityLevels = Object.values(SeniorityLevel);

  periodOptions: PeriodOption[] = this.buildPeriodOptions();

  constructor() {
    this.loadDepartments();
  }
  readonly form = this.fb.nonNullable.group({
    fiscalYear: [null as number | null, Validators.required],
    quarter: [null as PlanQuarter | null, Validators.required],
    departmentId: ['', Validators.required],
    targetHeadcount: [1 as number | null, [Validators.required, headcountValidator]],
    positionRegistryId: ['', Validators.required],
    proposedJobTitle: [''],
    proposedJobSeniorityLevel: [null as SeniorityLevel | null],
  });

  isExistingMode = computed(() => this.positionMode() === 'existing');

  onPeriodChange(option: PeriodOption): void {
    this.form.controls.fiscalYear.setValue(option?.fiscalYear ?? null);
    this.form.controls.quarter.setValue(option?.quarter ?? null);
  }

  onPositionModeChange(mode: PositionMode): void {
    if (this.positionMode() === mode) return;
    this.positionMode.set(mode);

    const registry = this.form.controls.positionRegistryId;
    const title = this.form.controls.proposedJobTitle;
    const seniority = this.form.controls.proposedJobSeniorityLevel;

    if (mode === 'existing') {
      registry.addValidators(Validators.required);
      title.clearValidators();
      title.reset();
      seniority.clearValidators();
      seniority.reset();
    } else {
      registry.clearValidators();
      registry.reset();
      title.addValidators(Validators.required);
      seniority.addValidators(Validators.required);
    }
  }

  onDepartmentChanged(): void {
    this.positionsService.getLookup(this.form.controls.departmentId.value || undefined).subscribe({
      next: (res) => this.positions.set(res.data ?? []),
      error: () => this.positions.set([]),
    });
    this.form.controls.positionRegistryId.reset();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete form',
        detail: 'Please fill in all required fields.',
      });
      return;
    }
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const value = this.form.getRawValue();

    const request: CreateManPowerPlanRequest = {
      fiscalYear: value.fiscalYear!,
      quarter: value.quarter!,
      departmentId: value.departmentId,
      targetHeadcount: Number(value.targetHeadcount),
      isNewPositionTitle: this.positionMode() === 'adhoc',
      positionRegistryId: this.isExistingMode() ? value.positionRegistryId : null,
      proposedJobTitle: this.isExistingMode() ? null : value.proposedJobTitle.trim(),
      proposedJobSeniorityLevel:
        this.isExistingMode() ? SeniorityLevel.Fresh : value.proposedJobSeniorityLevel!,
    };

    this.plansService.create(request).subscribe({
      next: (res) => {
        const newId = res.data;
        if (!newId) {
          this.onCreateFailed();
          return;
        }
        this.submitForApproval(newId);
      },
      error: () => this.onCreateFailed(),
    });
  }

  cancel(): void {
    this.router.navigate(['/console/manpower-plan']);
  }

  private submitForApproval(planId: string): void {
    this.plansService.submit(planId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Submitted',
          detail: 'Manpower plan submitted for approval.',
        });
        this.navigateAfterCreate(planId);
      },
      error: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Created as Draft',
          detail: 'Plan created but could not be submitted for approval automatically.',
        });
        this.navigateAfterCreate(planId);
      },
    });
  }

  private navigateAfterCreate(planId: string): void {
    this.isSubmitting.set(false);
    this.router.navigate(['/console/manpower-plan', planId]);
  }

  private onCreateFailed(): void {
    this.isSubmitting.set(false);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create the manpower plan.',
    });
  }

  private buildPeriodOptions(): PeriodOption[] {
    const now = new Date();
    const startYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const options: PeriodOption[] = [];

    for (let year = startYear; year <= startYear + 1; year++) {
      const firstQuarter = year === startYear ? currentQuarter : 1;
      for (let q = firstQuarter; q <= 4; q++) {
        const quarter = `Q${q}` as PlanQuarter;
        options.push({ label: `${year} - ${quarter}`, fiscalYear: year, quarter });
      }
    }
    return options;
  }
  private loadDepartments(): void {
    this.departmentsService.getLookup().subscribe({
      next: (res) => this.departments.set(res.data ?? []),
      error: () => this.departments.set([]),
    });
  }

}
