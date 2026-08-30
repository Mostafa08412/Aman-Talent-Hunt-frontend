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
import { MessageService } from 'primeng/api';

import { AdminManpowerPlansService } from '../../core/services/admin-manpower-plans.service';
import { AdminDepartmentsService } from '../../core/services/admin-departments.service';
import { AdminPositionsService } from '../../core/services/admin-positions.service';
import { LookupItemDto } from '../../core/models/lookup-model';
import { CreateManPowerPlanRequest } from '../../core/models/admin-manpower-plan-model';
import { PlanQuarter, SeniorityLevel } from '../../core/models/enums';

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

function nonBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  return value.trim().length > 0 ? null : { blank: true };
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
  ],
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

  departments = signal<LookupItemDto[]>([]);
  positions = signal<LookupItemDto[]>([]);

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
    proposedJobTitle: ['', [Validators.maxLength(120)]],
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
      registry.setValidators(Validators.required);
      title.setValidators([Validators.maxLength(120)]);
      seniority.setValidators(null);
      title.reset();
      seniority.reset();
    } else {
      registry.setValidators(null);
      title.setValidators([Validators.required, nonBlankValidator, Validators.maxLength(120)]);
      seniority.setValidators(Validators.required);
      registry.reset();
      seniority.reset();
    }
    this.form.updateValueAndValidity();
  }

  onDepartmentChanged(): void {
    this.positionsService.getLookup({ departmentId: this.form.controls.departmentId.value || undefined }).subscribe({
      next: (res) => this.positions.set(res.data?.items ?? []),
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
        this.isSubmitting.set(false);
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
      next: (res) => this.departments.set(res.data?.items ?? []),
      error: () => this.departments.set([]),
    });
  }

}
