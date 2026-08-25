import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  AdminRequisitionsQueryParams,
  AdminRequisitionsService,
} from '../../../core/services/admin-requisitions.service';
import { AdminDepartmentsService } from '../../../core/services/admin-departments.service';
import { AdminSquadsService } from '../../../core/services/admin-squads.service';
import { JobRequisitionListItemDto } from '../../../core/models/admin-requisition-model';
import { LookupItemDto } from '../../../core/models/lookup-model';
import { HiringType, RequisitionStatus } from '../../../core/models/enums';

interface FilterOption<T> {
  label: string;
  value: T | null;
}

@Component({
  selector: 'app-requisition-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, SelectModule, ToastModule],
  providers: [MessageService],
  templateUrl: './requisition-list.component.html',
  styleUrl: './requisition-list.component.scss',
})
export class RequisitionListComponent implements OnInit {
  private requisitionsService = inject(AdminRequisitionsService);
  private departmentsService = inject(AdminDepartmentsService);
  private squadsService = inject(AdminSquadsService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  requisitions = signal<JobRequisitionListItemDto[]>([]);
  departments = signal<LookupItemDto[]>([]);
  squads = signal<LookupItemDto[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);

  /* Filters — UI-bound selections stay staged until Apply commits them. */
  departmentFilter: string | null = null;
  squadFilter: string | null = null;
  hiringTypeFilter: HiringType | null = null;
  statusFilter: RequisitionStatus | null = null;
  yearFilter: number | null = null;

  private appliedDepartment: string | null = null;
  private appliedSquad: string | null = null;
  private appliedHiringType: HiringType | null = null;
  private appliedStatus: RequisitionStatus | null = null;
  private appliedYear: number | null = null;

  readonly hiringTypeOptions: FilterOption<HiringType>[] =
    Object.values(HiringType).map((type) => ({ label: this.humanize(type), value: type }));

  readonly statusOptions: FilterOption<RequisitionStatus>[] =
    Object.values(RequisitionStatus).map((status) => ({ label: this.humanize(status), value: status }));

  readonly yearOptions: FilterOption<number>[] = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { label: String(year), value: year };
  });

  /* Pagination */
  page = signal(1);
  readonly pageSize = 10;

  ngOnInit(): void {
    this.loadRequisitions();
    this.loadLookups();
  }

  loadRequisitions(): void {
    this.isLoading.set(true);

    const params: AdminRequisitionsQueryParams = {
      Page: this.page(),
      PageSize: this.pageSize,
      DepartmentId: this.appliedDepartment ?? undefined,
      SquadId: this.appliedSquad ?? undefined,
      HiringType: this.appliedHiringType ?? undefined,
      Status: this.appliedStatus ?? undefined,
      Year: this.appliedYear ?? undefined,
    };

    this.requisitionsService.getList(params).subscribe({
      next: (res) => {
        const data = res.data;
        this.requisitions.set(data?.items ?? []);
        this.totalCount.set(data?.totalCount ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load requisitions.',
        });
      },
    });
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

  applyFilters(): void {
    this.appliedDepartment = this.departmentFilter;
    this.appliedSquad = this.squadFilter;
    this.appliedHiringType = this.hiringTypeFilter;
    this.appliedStatus = this.statusFilter;
    this.appliedYear = this.yearFilter;
    this.page.set(1);
    this.loadRequisitions();
  }

  clearFilters(): void {
    this.departmentFilter = null;
    this.squadFilter = null;
    this.hiringTypeFilter = null;
    this.statusFilter = null;
    this.yearFilter = null;
    this.applyFilters();
  }

  openRequisition(requisition: JobRequisitionListItemDto): void {
    this.router.navigate(['/console/requisitions', requisition.id]);
  }

  hiringTypeLabel(type: HiringType): string {
    return this.humanize(type);
  }

  statusLabel(status: RequisitionStatus): string {
    return this.humanize(status);
  }

  statusSeverity(status: RequisitionStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (status === RequisitionStatus.Approved || status === RequisitionStatus.Published
      || status === RequisitionStatus.Fulfilled) {
      return 'success';
    }
    if (status === RequisitionStatus.Rejected) {
      return 'danger';
    }
    if (status === RequisitionStatus.OnHold || status === RequisitionStatus.Closed) {
      return 'warning';
    }
    if (status === RequisitionStatus.Draft) {
      return 'neutral';
    }
    return 'info';
  }

  private humanize(value: string): string {
    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
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

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page();
    if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
    const wanted = [current - 1, current, current + 1, total].filter((p) => p >= 1 && p <= total);
    return [...new Set([1, ...wanted])].sort((a, b) => a - b);
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages);
    if (clamped === this.page()) return;
    this.page.set(clamped);
    this.loadRequisitions();
  }
}
