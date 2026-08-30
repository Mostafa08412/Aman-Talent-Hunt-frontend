import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

import { AdminPositionsService } from '../../../core/services/admin-positions.service';
import { AdminDepartmentsService } from '../../../core/services/admin-departments.service';
import { AdminJobDescriptionsService } from '../../../core/services/admin-job-descriptions.service';
import { LookupItemDto } from '../../../core/models/lookup-model';
import { SeniorityLevel, JobDescriptionStatus } from '../../../core/models/enums';

interface SeniorityOption {
  label: string;
  value: SeniorityLevel;
}

@Component({
  selector: 'app-position-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
  ],
  templateUrl: './position-add.component.html',
  styleUrl: './position-add.component.scss',
})
export class PositionAddComponent implements OnInit {
  private readonly positionsService = inject(AdminPositionsService);
  private readonly departmentsService = inject(AdminDepartmentsService);
  private readonly jobDescriptionsService = inject(AdminJobDescriptionsService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  departments = signal<LookupItemDto[]>([]);
  isSubmitting = false;

  /* Only Approved job descriptions may be linked to a new position. */
  jobDescriptions = signal<LookupItemDto[]>([]);
  jdLoading = signal(false);

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
    this.departmentsService.getLookup().subscribe({
      next: (res) => this.departments.set(res.data?.items ?? []),
      error: () => this.departments.set([]),
    });

    this.loadJobDescriptions();
  }

  private loadJobDescriptions(): void {
    this.jdLoading.set(true);
    this.jobDescriptionsService.getLookup({}).subscribe({
      next: (res) => {
        this.jobDescriptions.set(res.data?.items ?? []);
        this.jdLoading.set(false);
      },
      error: () => {
        this.jobDescriptions.set([]);
        this.jdLoading.set(false);
      },
    });
  }

  /* ── Submit ── */

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const value = this.form.getRawValue();

    this.positionsService
      .create({
        title: value.title.trim(),
        departmentId: value.departmentId,
        jobDescriptionId: value.jobDescriptionId,
        seniorityLevel: value.seniorityLevel as SeniorityLevel,
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (!res.isCompletedSuccessfully) {
            return;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: 'Position created successfully.',
          });
          this.router.navigate(['/console/admin/positions']);
        },
        error: () => {
          this.isSubmitting = false;
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/console/admin/positions']);
  }
}
