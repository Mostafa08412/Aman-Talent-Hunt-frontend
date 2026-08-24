import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  AdminPositionsQueryParams,
  AdminPositionsService,
} from '../../../core/services/admin-positions.service';
import { AdminDepartmentsService } from '../../../core/services/admin-departments.service';
import { PositionRegistryListItemDto } from '../../../core/models/admin-position-model';
import { DepartmentLookupDto } from '../../../core/models/admin-department-model';
import { SeniorityLevel } from '../../../core/models/enums';

interface DepartmentOption {
  label: string;
  value: string | null;
}

interface StatusOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, ToastModule],
  providers: [MessageService],
  templateUrl: './positions.component.html',
  styleUrl: './positions.component.scss',
})
export class PositionsComponent implements OnInit {
  private positionsService = inject(AdminPositionsService);
  private departmentsService = inject(AdminDepartmentsService);
  private messageService = inject(MessageService);

  positions = signal<PositionRegistryListItemDto[]>([]);
  isLoading = signal(false);
  departments = signal<DepartmentLookupDto[]>([]);
  totalCount = signal(0);

  search = '';
  departmentFilter: string | null = null;
  statusFilter: string | null = null;

  private appliedSearch = '';
  private appliedDepartment: string | null = null;
  private appliedStatus: string | null = null;

  readonly statusOptions: StatusOption[] = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  page = signal(1);
  readonly pageSize = 10;

  ngOnInit(): void {
    this.loadPositions();
    this.loadDepartments();
  }

  loadPositions(): void {
    this.isLoading.set(true);

    const params: AdminPositionsQueryParams = {
      Page: this.page(),
      PageSize: this.pageSize,
      Search: this.appliedSearch || undefined,
      DepartmentId: this.appliedDepartment ?? undefined,
      IsActive:
        this.appliedStatus === 'active'
          ? true
          : this.appliedStatus === 'inactive'
            ? false
            : undefined,
    };

    this.positionsService.getList(params).subscribe({
      next: (res) => {
        const data = res.data;
        this.positions.set(data?.items ?? []);
        this.totalCount.set(data?.totalCount ?? 0);
        this.isLoading.set(false);
      },
      error: () => this.onLoadFailed(),
    });
  }

  private onLoadFailed(): void {
    this.isLoading.set(false);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load positions.',
    });
  }

  private loadDepartments(): void {
    this.departmentsService.getLookup().subscribe({
      next: (res) => this.departments.set(res.data ?? []),
      error: () => this.departments.set([]),
    });
  }

  applyFilters(): void {
    this.appliedSearch = this.search.trim();
    this.appliedDepartment = this.departmentFilter;
    this.appliedStatus = this.statusFilter;
    this.page.set(1);
    this.loadPositions();
  }

  clearFilters(): void {
    this.search = '';
    this.departmentFilter = null;
    this.statusFilter = null;
    this.applyFilters();
  }

  get totalFiltered(): number {
    return this.totalCount();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }

  get rangeStart(): number {
    return this.totalFiltered === 0 ? 0 : (this.page() - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page() * this.pageSize, this.totalFiltered);
  }

  /** Windowed page numbers with an ellipsis tail, mirroring the reference layout. */
  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page();
    if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
    const wanted = [current - 1, current, current + 1, total].filter(
      (p) => p >= 1 && p <= total,
    );
    const sorted = [...new Set([1, ...wanted])].sort((a, b) => a - b);
    return sorted;
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages);
    if (clamped === this.page()) return;
    this.page.set(clamped);
    this.loadPositions();
  }

  previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  referenceCode(position: PositionRegistryListItemDto): string {
    return position.referenceNumber || position.id.slice(0, 8).toUpperCase();
  }

  levelLabel(level: SeniorityLevel): string {
    switch (level) {
      case SeniorityLevel.Intern:
        return 'L1 · Intern';
      case SeniorityLevel.Fresh:
        return 'L2 · Fresh';
      case SeniorityLevel.Junior:
        return 'L3 · Junior';
      case SeniorityLevel.Senior:
        return 'L4 · Senior';
      default:
        return level;
    }
  }
}
