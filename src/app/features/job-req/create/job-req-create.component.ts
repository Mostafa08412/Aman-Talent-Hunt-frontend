import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';

import { JOB_REQUISITION_API } from '../../../core/services/job-requisition-api';
import type { CreateRequisitionRequest } from '../../../core/models/job-requisition-model';
import { HiringType, Location, RequisitionType, SeniorityLevel } from '../../../core/models/job-requisition-model';
import type { LookupItemDto } from '../../../core/models/lookup-model';
import { AdminDepartmentsService } from '@core/services/admin-departments.service';
import { AdminManpowerPlansService } from '@core/services/admin-manpower-plans.service';

interface TypeCard {
  value: RequisitionType;
  label: string;
  description: string;
  icon: string;
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
  selector: 'app-job-req-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    MessageModule,
  ],
  templateUrl: './job-req-create.component.html',
  styleUrl: './job-req-create.component.scss',
})
export class JobReqCreateComponent implements OnInit {
  private api = inject(JOB_REQUISITION_API);
  private mppService = inject(AdminManpowerPlansService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly RequisitionType = RequisitionType;
  readonly locations = Object.values(Location);
  readonly seniorityLevels = Object.values(SeniorityLevel);

  readonly typeCards: TypeCard[] = [
    {
      value: RequisitionType.PlannedExisting,
      label: 'Planned · Existing Job',
      description: 'Open hiring against an approved manpower plan line.',
      icon: 'pi pi-briefcase',
    },
    {
      value: RequisitionType.PlannedAdHoc,
      label: 'Planned · Ad-hoc Job',
      description: 'Backfill planned work with a newly scoped role.',
      icon: 'pi pi-calendar-plus',
    },
    {
      value: RequisitionType.Replacement,
      label: 'Replacement',
      description: 'Replace a departing employee in an existing position.',
      icon: 'pi pi-replay',
    },
    {
      value: RequisitionType.GrowthExisting,
      label: 'Growth · Existing Job',
      description: 'Add headcount to an existing, approved job title.',
      icon: 'pi pi-chart-line',
    },
    {
      value: RequisitionType.GrowthAdHoc,
      label: 'Growth · Ad-hoc Job',
      description: 'Create a brand-new position justified by growth.',
      icon: 'pi pi-sparkles',
    },
  ];

  readonly step = signal<1 | 2 | 3>(1);
  readonly selectedType = signal<RequisitionType | null>(null);
  isSubmitting = signal(false);

  departments = signal<LookupItemDto[]>([]);
  squads = signal<LookupItemDto[]>([]);
  hrManagers = signal<LookupItemDto[]>([]);
  manpowerPlans = signal<LookupItemDto[]>([]);
  positions = signal<LookupItemDto[]>([]);
  departingEmployees = signal<LookupItemDto[]>([]);

  readonly form = this.fb.nonNullable.group({
    departmentId: ['', Validators.required],
    assignedSquadId: ['', Validators.required],
    location: [null as Location | null, Validators.required],
    requestedHeadcount: [1 as number | null, [Validators.required, headcountValidator]],
    hrManagerId: ['', Validators.required],
    manPowerPlanId: [''],
    positionRegistryId: [''],
    departingEmployeeId: [''],
    proposedJobTitle: ['', [Validators.maxLength(200)]],
    proposedJobSeniorityLevel: [null as SeniorityLevel | null],
    growthJustification: ['', [Validators.maxLength(2000)]],
  });

  readonly isGrowth = computed(
    () => this.selectedType() === RequisitionType.GrowthAdHoc || this.selectedType() === RequisitionType.GrowthExisting,
  );

  hasError(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  /** Empty placeholder every Back / type switch resets the form against. */
  private readonly initialValues = {
    departmentId: '',
    assignedSquadId: '',
    location: null as Location | null,
    requestedHeadcount: 1,
    hrManagerId: '',
    manPowerPlanId: '',
    positionRegistryId: '',
    departingEmployeeId: '',
    proposedJobTitle: '',
    proposedJobSeniorityLevel: null as SeniorityLevel | null,
    growthJustification: '',
  };

  ngOnInit(): void {
    this.api.getDepartmentOptions({ PageSize: 100 }).subscribe({ next: (res) => this.departments.set(res.data?.items ?? []) });
    this.api.getEmployeeOptions({ role: 'HR_MANAGER', PageSize: 100 }).subscribe({ next: (res) => this.hrManagers.set(res.data?.items ?? []) });
    this.api.getDepartingEmployeeOptions({ PageSize: 100 }).subscribe({ next: (res) => this.departingEmployees.set(res.data?.items ?? []) });
  }

  // ── Step navigation ──

  pickType(type: RequisitionType): void {
    if (this.selectedType() !== type) this.resetFields();
    this.selectedType.set(type);
    this.applyTypeValidators();
  }

  goToDetails(): void {
    if (!this.selectedType()) return;
    this.step.set(2);
  }

  backToType(): void {
    this.resetFields();
    this.step.set(1);
  }

  goToReview(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.step.set(3);
  }

  backToDetails(): void {
    this.resetFields();
    this.step.set(2);
  }

  /**
   * Clears every field's state — values, pristine/dirty, touched/untouched and
   * validation errors — and empties the dependent dropdown option lists so no
   * stale selection (squad, manpower plan, position, department head) lingers.
   */
  resetFields(): void {
    this.form.reset(this.initialValues);
    this.squads.set([]);
    this.manpowerPlans.set([]);
    this.positions.set([]);
  }

  // ── Dependent lookups ──

  onDepartmentChanged(): void {
    const departmentId = this.form.controls.departmentId.value || undefined;
    this.form.controls.assignedSquadId.reset();
    this.form.controls.manPowerPlanId.reset();
    this.form.controls.positionRegistryId.reset();

    this.api.getSquadOptions({ departmentId }).subscribe({ next: (res) => this.squads.set(res.data?.items ?? []) });
    this.loadManpowerPlans();
    this.api.getActivePositionOptions({ departmentId }).subscribe({ next: (res) => this.positions.set(res.data?.items ?? []) });
  }

  /**
   * Loads the manpower plan lines for the current department, filtered to the selected
   * requisition type: Planned Existing Job → existing lines (isAdHocJob=false),
   * Planned Ad-hoc Job → ad-hoc lines (isAdHocJob=true).
   */
  private loadManpowerPlans(): void {
    const departmentId = this.form.controls.departmentId.value || undefined;
    const isAdHocJob = this.selectedType() === RequisitionType.PlannedAdHoc
      ? true
      : this.selectedType() === RequisitionType.PlannedExisting
        ? false
        : undefined;
    this.form.controls.manPowerPlanId.reset();
    this.api
      .getOpenManPowerPlanOptions({ departmentId, isAdHocJob })
      .subscribe({ next: (res) => this.manpowerPlans.set(res.data?.items ?? []) });
  }

  private applyTypeValidators(): void {
    const c = this.form.controls;

    const setRequired = (control: AbstractControl, required: boolean, extra: ValidatorFn[] = []) => {
      control.clearValidators();
      control.addValidators([...(required ? [Validators.required] : []), ...extra]);
    };

    switch (this.selectedType()) {
      case RequisitionType.PlannedExisting:
        setRequired(c.manPowerPlanId, true);
        break;
      case RequisitionType.PlannedAdHoc:
        setRequired(c.manPowerPlanId, true);
        setRequired(c.proposedJobTitle, true, [nonBlankValidator, Validators.maxLength(200)]);
        setRequired(c.proposedJobSeniorityLevel, true);
        break;
      case RequisitionType.Replacement:
        setRequired(c.departingEmployeeId, true);
        setRequired(c.positionRegistryId, true);
        break;
      case RequisitionType.GrowthExisting:
        setRequired(c.proposedJobTitle, true, [nonBlankValidator, Validators.maxLength(200)]);
        setRequired(c.proposedJobSeniorityLevel, true);
        break;
      case RequisitionType.GrowthAdHoc:
        setRequired(c.proposedJobTitle, true, [nonBlankValidator, Validators.maxLength(200)]);
        setRequired(c.proposedJobSeniorityLevel, true);
        setRequired(c.growthJustification, true, [nonBlankValidator, Validators.maxLength(2000)]);
        break;
    }
    this.form.updateValueAndValidity();
  }

  // ── Review + submit ──

  buildRequest(): CreateRequisitionRequest | null {
    const v = this.form.getRawValue();
    const type = this.selectedType();
    if (!type) return null;
    const base = {
      departmentId: v.departmentId,
      assignedSquadId: v.assignedSquadId,
      location: v.location!,
      requestedHeadcount: Number(v.requestedHeadcount),
      selectedHRManagerId: v.hrManagerId,
    };

    switch (type) {
      case RequisitionType.PlannedExisting:
        return { hiringType: HiringType.Backfill, manPowerPlanId: v.manPowerPlanId, ...base };
      case RequisitionType.PlannedAdHoc:
        return {
          hiringType: HiringType.Backfill,
          manPowerPlanId: v.manPowerPlanId || null,
          proposedJobTitle: v.proposedJobTitle.trim(),
          proposedJobSeniorityLevel: v.proposedJobSeniorityLevel!,
          ...base,
        };
      case RequisitionType.Replacement: {
        const employee = this.departingEmployees().find((e) => e.id === v.departingEmployeeId);
        return {
          hiringType: HiringType.Replacement,
          departingEmployeeName: employee?.viewText ?? '',
          departingEmployeeId: v.departingEmployeeId,
          positionRegistryId: v.positionRegistryId,
          ...base,
        };
      }
      case RequisitionType.GrowthExisting:
        return {
          hiringType: HiringType.NewPosition,
          positionRegistryId: v.positionRegistryId || null,
          proposedJobTitle: v.proposedJobTitle.trim(),
          proposedJobSeniorityLevel: v.proposedJobSeniorityLevel!,
          growthJustification: v.growthJustification.trim() || null,
          ...base,
        };
      case RequisitionType.GrowthAdHoc:
        return {
          hiringType: HiringType.NewPosition,
          proposedJobTitle: v.proposedJobTitle.trim(),
          proposedJobSeniorityLevel: v.proposedJobSeniorityLevel!,
          growthJustification: v.growthJustification.trim() || null,
          ...base,
        };
    }
  }

  reviewRows(): { label: string; value: string }[] {
    const request = this.buildRequest();
    if (!request) return [];
    const nameOf = (options: LookupItemDto[], id: string | null | undefined) =>
      options.find((o) => o.id === id)?.viewText ?? id ?? '—';

    return [
      { label: 'Hiring Type', value: humanize(request.hiringType) },
      { label: 'Department', value: nameOf(this.departments(), request.departmentId) },
      { label: 'Squad', value: nameOf(this.squads(), request.assignedSquadId) },
      { label: 'Location', value: request.location },
      { label: 'Requested Headcount', value: String(request.requestedHeadcount) },
      { label: 'HR Manager', value: nameOf(this.hrManagers(), request.selectedHRManagerId) },
    ];
  }

  submit(): void {
    const request = this.buildRequest();
    if (!request || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    this.api.create(request).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (!res.isCompletedSuccessfully || !res.data) {
          return;
        }
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Draft requisition created.' });
        this.router.navigate(['/console/job-requisitions', res.data]);
      },
      error: () => {
        this.isSubmitting.set(false);
      },
    });
  }
}

const ENUM_ABBREVIATIONS: Record<string, string> = { JD: 'Job Description' };

/**
 * Humanizes backend enum wire values for display:
 *  - PascalCase (e.g. "NewPosition", "OnHold") → "New Position", "On Hold"
 *  - SCREAMING_SNAKE (e.g. "HR_MANAGER") → "HR Manager"
 *  - expands common acronyms (JD → Job Description, etc.)
 * Leaves ordinary words (Backfill, Draft, …) as-is.
 */
function humanize(value: string): string {
  if (!value) return value;
  const words = String(value)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 0);

  return words
    .map((word) => {
      const upper = word.toUpperCase();
      const abbreviation = ENUM_ABBREVIATIONS[upper];
      if (abbreviation) return abbreviation;
      if (word === upper && word.length <= 3) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
