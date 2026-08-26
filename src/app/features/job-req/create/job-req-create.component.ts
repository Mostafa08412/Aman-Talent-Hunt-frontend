import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';

import { JOB_REQUISITION_API } from '../../../core/services/job-requisition-api';
import type { CreateJobRequisitionRequest } from '../../../core/models/job-requisition-model';
import { Location, RequisitionType, SeniorityLevel } from '../../../core/models/job-requisition-model';
import type { LookupItemDto } from '../../../core/models/lookup-model';

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
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './job-req-create.component.html',
  styleUrl: './job-req-create.component.scss',
})
export class JobReqCreateComponent implements OnInit {
  private api = inject(JOB_REQUISITION_API);
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
      icon: 'pi pi-calendar-check',
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
  departmentHeads = signal<LookupItemDto[]>([]);
  manpowerPlans = signal<LookupItemDto[]>([]);
  positions = signal<LookupItemDto[]>([]);
  departingEmployees = signal<LookupItemDto[]>([]);

  readonly form = this.fb.nonNullable.group({
    departmentId: ['', Validators.required],
    assignedSquadId: ['', Validators.required],
    location: [null as Location | null, Validators.required],
    requestedHeadcount: [1 as number | null, [Validators.required, headcountValidator]],
    hrManagerId: ['', Validators.required],
    departmentHeadId: [''],
    manPowerPlanId: [''],
    positionRegistryId: [''],
    departingEmployeeId: [''],
    proposedJobTitle: [''],
    proposedJobSeniorityLevel: [null as SeniorityLevel | null],
    growthJustification: [''],
  });

  readonly isGrowth = computed(
    () => this.selectedType() === RequisitionType.GrowthAdHoc || this.selectedType() === RequisitionType.GrowthExisting,
  );

  ngOnInit(): void {
    this.api.getDepartmentOptions().subscribe({ next: (res) => this.departments.set(res.data ?? []) });
    this.api.getEmployeeOptions('HR_MANAGER').subscribe({ next: (res) => this.hrManagers.set(res.data ?? []) });
    this.api.getDepartingEmployeeOptions().subscribe({ next: (res) => this.departingEmployees.set(res.data ?? []) });
  }

  // ── Step navigation ──

  pickType(type: RequisitionType): void {
    this.selectedType.set(type);
    this.applyTypeValidators();
  }

  goToDetails(): void {
    if (!this.selectedType()) return;
    this.step.set(2);
  }

  backToType(): void {
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
    this.step.set(2);
  }

  // ── Dependent lookups ──

  onDepartmentChanged(): void {
    const departmentId = this.form.controls.departmentId.value || undefined;
    this.form.controls.assignedSquadId.reset();
    this.form.controls.manPowerPlanId.reset();
    this.form.controls.positionRegistryId.reset();

    this.api.getSquadOptions(departmentId).subscribe({ next: (res) => this.squads.set(res.data ?? []) });
    this.api.getOpenManPowerPlanOptions(departmentId).subscribe({ next: (res) => this.manpowerPlans.set(res.data ?? []) });
    this.api.getActivePositionOptions(departmentId).subscribe({ next: (res) => this.positions.set(res.data ?? []) });
    if (this.isGrowth()) {
      this.api
        .getEmployeeOptions('DEPARTMENT_HEAD', departmentId)
        .subscribe({ next: (res) => this.departmentHeads.set(res.data ?? []), error: () => this.departmentHeads.set([]) });
    }
  }

  private applyTypeValidators(): void {
    const c = this.form.controls;

    const setRequired = (control: AbstractControl, required: boolean) => {
      control.clearValidators();
      control.addValidators(required ? Validators.required : []);
    };

    switch (this.selectedType()) {
      case RequisitionType.PlannedExisting:
        setRequired(c.manPowerPlanId, true);
        break;
      case RequisitionType.PlannedAdHoc:
        setRequired(c.proposedJobTitle, true);
        setRequired(c.proposedJobSeniorityLevel, true);
        break;
      case RequisitionType.Replacement:
        setRequired(c.departingEmployeeId, true);
        setRequired(c.positionRegistryId, true);
        break;
      case RequisitionType.GrowthExisting:
        setRequired(c.proposedJobTitle, true);
        setRequired(c.proposedJobSeniorityLevel, true);
        break;
      case RequisitionType.GrowthAdHoc:
        setRequired(c.proposedJobTitle, true);
        setRequired(c.proposedJobSeniorityLevel, true);
        setRequired(c.growthJustification, true);
        break;
    }
    this.form.updateValueAndValidity();
  }

  // ── Review + submit ──

  buildRequest(): CreateJobRequisitionRequest | null {
    const v = this.form.getRawValue();
    const type = this.selectedType();
    if (!type) return null;
    const base = {
      departmentId: v.departmentId,
      assignedSquadId: v.assignedSquadId,
      location: v.location!,
      requestedHeadcount: Number(v.requestedHeadcount),
      hrManagerId: v.hrManagerId,
    };

    switch (type) {
      case RequisitionType.PlannedExisting:
        return { requisitionType: type, manPowerPlanId: v.manPowerPlanId, ...base };
      case RequisitionType.PlannedAdHoc:
        return {
          requisitionType: type,
          manPowerPlanId: v.manPowerPlanId || null,
          proposedJobTitle: v.proposedJobTitle.trim(),
          proposedJobSeniorityLevel: v.proposedJobSeniorityLevel!,
          growthJustification: v.growthJustification.trim() || null,
          ...base,
        };
      case RequisitionType.Replacement: {
        const employee = this.departingEmployees().find((e) => e.id === v.departingEmployeeId);
        return {
          requisitionType: type,
          departingEmployeeName: employee?.viewText ?? '',
          departingEmployeeId: v.departingEmployeeId,
          positionRegistryId: v.positionRegistryId,
          ...base,
        };
      }
      case RequisitionType.GrowthExisting:
      case RequisitionType.GrowthAdHoc:
        return {
          requisitionType: type,
          departmentHeadId: v.departmentHeadId || null,
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
      { label: 'Requisition Type', value: humanize(request.requisitionType) },
      { label: 'Department', value: nameOf(this.departments(), request.departmentId) },
      { label: 'Squad', value: nameOf(this.squads(), request.assignedSquadId) },
      { label: 'Location', value: request.location },
      { label: 'Requested Headcount', value: String(request.requestedHeadcount) },
      { label: 'HR Manager', value: nameOf(this.hrManagers(), request.hrManagerId) },
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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message ?? 'Failed to create the requisition.',
          });
          return;
        }
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Draft requisition created.' });
        this.router.navigate(['/console/job-requisitions', res.data.id]);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create the requisition.' });
      },
    });
  }
}

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
