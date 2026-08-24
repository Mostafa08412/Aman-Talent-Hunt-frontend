import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { AdminPositionsService } from '../../../core/services/admin-positions.service';
import { AdminDepartmentsService } from '../../../core/services/admin-departments.service';
import { AdminJobDescriptionsService } from '../../../core/services/admin-job-descriptions.service';
import { DepartmentLookupDto } from '../../../core/models/admin-department-model';
import { JobDescriptionListItemDto } from '../../../core/models/admin-job-description-model';
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
    ToastModule,
  ],
  providers: [MessageService],
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

  departments = signal<DepartmentLookupDto[]>([]);
  isSubmitting = false;

  /* JD picker — suggestions come from the corporate JD library (approved only). */
  jdSuggestions = signal<JobDescriptionListItemDto[]>([]);
  jdSearching = signal(false);
  jdPanelOpen = signal(false);
  selectedJd = signal<JobDescriptionListItemDto | null>(null);

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

  private readonly jdSearchTerm$ = new Subject<string>();

  ngOnInit(): void {
    this.departmentsService.getLookup().subscribe({
      next: (res) => this.departments.set(res.data ?? []),
      error: () => this.departments.set([]),
    });

    this.jdSearchTerm$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.searchJd(term));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.jd-picker')) this.jdPanelOpen.set(false);
  }

  /* ── JD picker ── */

  onJdSearchInput(value: string): void {
    this.jdSearchTerm$.next(value.trim());
  }

  onJdFocus(): void {
    if (this.jdSuggestions().length) this.jdPanelOpen.set(true);
  }

  searchJd(term: string): void {
    if (!term) {
      this.jdSuggestions.set([]);
      this.jdPanelOpen.set(false);
      return;
    }
    this.jdSearching.set(true);
    this.jobDescriptionsService
      .getList({
        Status: JobDescriptionStatus.Approved,
        Search: term,
        PageSize: 8,
      })
      .subscribe({
        next: (res) => {
          this.jdSuggestions.set(res.data?.items ?? []);
          this.jdPanelOpen.set(true);
          this.jdSearching.set(false);
        },
        error: () => {
          this.jdSuggestions.set([]);
          this.jdSearching.set(false);
        },
      });
  }

  selectJd(jd: JobDescriptionListItemDto): void {
    this.selectedJd.set(jd);
    this.form.controls.jobDescriptionId.setValue(jd.id);
    this.jdPanelOpen.set(false);
    if (!this.form.controls.title.value) {
      this.form.controls.title.setValue((jd.summary ?? '').trim());
    }
  }

  clearJd(): void {
    this.selectedJd.set(null);
    this.form.controls.jobDescriptionId.reset();
  }

  truncate(text: string | null, max = 70): string {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
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
        next: () => {
          this.isSubmitting = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: 'Position created successfully.',
          });
          this.router.navigate(['/console/admin/positions']);
        },
        error: () => {
          this.isSubmitting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create position.',
          });
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/console/admin/positions']);
  }
}
