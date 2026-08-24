import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import {
  AdminManpowerPlansQueryParams,
  AdminManpowerPlansService,
} from '../../core/services/admin-manpower-plans.service';
import { AdminDepartmentsService } from '../../core/services/admin-departments.service';
import { DepartmentLookupDto } from '../../core/models/admin-department-model';
import { ManPowerPlanListItemDto } from '../../core/models/admin-manpower-plan-model';
import { PlanQuarter, PlanStatus } from '../../core/models/enums';

interface FilterOption<T> {
  label: string;
  value: T | null;
}

@Component({
  selector: 'app-manpower-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    TableModule,
    SelectModule,
    InputTextModule,
    TagModule,
    MessageModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './manpower-plan.component.html',
  styleUrl: './manpower-plan.component.scss',
})
export class ManpowerPlanComponent {
  private plansService = inject(AdminManpowerPlansService);
  private departmentsService = inject(AdminDepartmentsService);
  private router = inject(Router);

  entries = signal<ManPowerPlanListItemDto[]>([]);
  departments = signal<DepartmentLookupDto[]>([]);

  loading = signal(true);
  loadError = signal<string | null>(null);
  totalCount = signal(0);

  /* Filters — UI-bound selections are committed to the applied* fields on
     change (selects) or search submit, then reloaded from the first page. */
  readonly currentYear = new Date().getFullYear();
  readonly fiscalYears: number[] = [this.currentYear - 1, this.currentYear, this.currentYear + 1];

  fiscalYearFilter: number | null = null;
  quarterFilter: PlanQuarter | null = null;
  departmentFilter: string | null = null;
  statusFilter: PlanStatus | null = null;
  search = '';

  private appliedFiscalYear: number | null = null;
  private appliedQuarter: PlanQuarter | null = null;
  private appliedDepartment: string | null = null;
  private appliedStatus: PlanStatus | null = null;
  private appliedSearch = '';

  readonly quarterOptions: FilterOption<PlanQuarter>[] = [
    { label: 'All Quarters', value: null },
    ...Object.values(PlanQuarter).map((q) => ({ label: q, value: q })),
  ];

  readonly statusOptions: FilterOption<PlanStatus>[] = [
    { label: 'All Statuses', value: null },
    ...Object.values(PlanStatus).map((s) => ({ label: s, value: s })),
  ];

  /* Pagination */
  page = signal(1);
  readonly pageSize = 10;

  constructor() {
    this.loadDepartments();
    this.loadPlans();
  }

  onFiscalYearChange(year: number | null): void {
    this.fiscalYearFilter = year;
    this.appliedFiscalYear = year;
    this.applyFilters();
  }

  onQuarterChange(quarter: PlanQuarter | null): void {
    this.quarterFilter = quarter;
    this.appliedQuarter = quarter;
    this.applyFilters();
  }

  onDepartmentChange(departmentId: string | null): void {
    this.departmentFilter = departmentId;
    this.appliedDepartment = departmentId;
    this.applyFilters();
  }

  onStatusChange(status: PlanStatus | null): void {
    this.statusFilter = status;
    this.appliedStatus = status;
    this.applyFilters();
  }

  applyFilters(): void {
    this.appliedSearch = this.search.trim();
    this.page.set(1);
    this.loadPlans();
  }

  clearFilters(): void {
    this.fiscalYearFilter = null;
    this.quarterFilter = null;
    this.departmentFilter = null;
    this.statusFilter = null;
    this.search = '';
    this.appliedFiscalYear = null;
    this.appliedQuarter = null;
    this.appliedDepartment = null;
    this.appliedStatus = null;
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return (
      !!this.appliedSearch ||
      this.appliedFiscalYear !== null ||
      this.appliedQuarter !== null ||
      this.appliedDepartment !== null ||
      this.appliedStatus !== null
    );
  }

  statusSeverity(status: PlanStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<PlanStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [PlanStatus.Draft]: 'secondary',
      [PlanStatus.PendingApproval]: 'warn',
      [PlanStatus.Approved]: 'success',
      [PlanStatus.Rejected]: 'danger',
      [PlanStatus.Active]: 'success',
      [PlanStatus.Fulfilled]: 'info',
      [PlanStatus.Closed]: 'contrast',
    };
    return map[status] ?? 'secondary';
  }

  private loadDepartments(): void {
    this.departmentsService.getLookup().subscribe({
      next: (res) => this.departments.set(res.data ?? []),
      error: () => this.departments.set([]),
    });
  }

  /** Server-side filters and pagination against GET /api/admin/manpower-plans. */
  private loadPlans(): void {
    this.loading.set(true);
    this.loadError.set(null);

    const params: AdminManpowerPlansQueryParams = {
      FiscalYear: this.appliedFiscalYear ?? undefined,
      Quarter: this.appliedQuarter ?? undefined,
      DepartmentId: this.appliedDepartment ?? undefined,
      Status: this.appliedStatus ?? undefined,
      Search: this.appliedSearch || undefined,
      Page: this.page(),
      PageSize: this.pageSize,
    };

    this.plansService.getList(params).subscribe({
      next: (res) => {
        const data = res.data;
        this.entries.set(data?.items ?? []);
        this.totalCount.set(data?.totalCount ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load the manpower plan right now. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  openPlan(plan: ManPowerPlanListItemDto): void {
    this.router.navigate(['/console/manpower-plan', plan.id]);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }

  get rangeStart(): number {
    return this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page() * this.pageSize, this.totalCount());
  }

  /** Windowed page numbers with an ellipsis tail, mirroring the employees list. */
  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page();
    if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
    const wanted = [current - 1, current, current + 1, total].filter((p) => p >= 1 && p <= total);
    const sorted = [...new Set([1, ...wanted])].sort((a, b) => a - b);
    return sorted;
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages);
    if (clamped === this.page()) return;
    this.page.set(clamped);
    this.loadPlans();
  }

  previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }
}
