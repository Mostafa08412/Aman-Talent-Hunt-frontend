import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  AdminEmployeesQueryParams,
  AdminEmployeesService,
} from '../../../core/services/admin-employees.service';
import { AdminSquadsService } from '../../../core/services/admin-squads.service';
import { AdminPositionsService } from '../../../core/services/admin-positions.service';
import { EmployeeListItemDto } from '../../../core/models/admin-employee-model';
import { LookupItemDto } from '../../../core/models/lookup-model';

interface StatusOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, SelectModule, ToastModule],
  providers: [MessageService],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
})
export class EmployeesComponent implements OnInit {
  private employeesService = inject(AdminEmployeesService);
  private squadsService = inject(AdminSquadsService);
  private positionsService = inject(AdminPositionsService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  /* Data — rows holds the current page for all/active modes and the full
     departing list (server-filtered by the departing endpoint) otherwise. */
  employees = signal<EmployeeListItemDto[]>([]);
  departing = signal<EmployeeListItemDto[]>([]);
  isLoading = signal(false);
  squads = signal<LookupItemDto[]>([]);
  positions = signal<LookupItemDto[]>([]);
  totalCount = signal(0);
  overallTotal = signal(0);

  /* Filters — UI-bound selections stay staged until the search button
     (or Enter) commits them to the applied* fields and reloads. */
  search = '';
  squadFilter: string | null = null;
  positionFilter: string | null = null;
  statusFilter: string | null = null;

  private appliedSearch = '';
  private appliedSquad: string | null = null;
  private appliedPosition: string | null = null;
  private appliedStatus: string | null = null;

  readonly statusOptions: StatusOption[] = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'active' },
    { label: 'Departing', value: 'departing' },
  ];

  /* Pagination */
  page = signal(1);
  readonly pageSize = 10;

  /* KPI cards — global numbers, unaffected by the current filters. */
  kpiTotal = computed(() => this.overallTotal());
  kpiActive = computed(() => Math.max(0, this.overallTotal() - this.departing().length));
  kpiDeparting = computed(() => this.departing().length);

  ngOnInit(): void {
    this.loadOverallTotals();
    this.loadEmployees();
    this.loadLookups();
  }

  /** One-off baseline counts for the KPI cards. */
  loadOverallTotals(): void {
    this.employeesService.getList({ Page: 1, PageSize: 1 }).subscribe({
      next: (res) => this.overallTotal.set(res.data?.totalCount ?? 0),
      error: () => this.overallTotal.set(0),
    });
    this.loadDeparting();
  }

  /** Server-side search, filters and pagination. */
  loadEmployees(): void {
    this.isLoading.set(true);

    if (this.appliedStatus === 'departing') {
      this.employeesService.getDeparting(this.appliedSearch || undefined).subscribe({
        next: (res) => {
          const items = res.data ?? [];
          this.employees.set(items);
          this.totalCount.set(items.length);
          this.isLoading.set(false);
        },
        error: () => this.onLoadFailed(),
      });
      return;
    }

    const params: AdminEmployeesQueryParams = {
      Page: this.page(),
      PageSize: this.pageSize,
      Search: this.appliedSearch || undefined,
      SquadId: this.appliedSquad ?? undefined,
      PositionRegistryId: this.appliedPosition ?? undefined,
    };

    this.employeesService.getList(params).subscribe({
      next: (res) => {
        const data = res.data;
        this.employees.set(data?.items ?? []);
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
      detail: 'Failed to load employees.',
    });
  }

  private loadDeparting(): void {
    this.employeesService.getDeparting().subscribe({
      next: (res) => this.departing.set(res.data ?? []),
      error: () => this.departing.set([]),
    });
  }

  private loadLookups(): void {
    this.squadsService.getLookup().subscribe({
      next: (res) => this.squads.set(res.data?.items ?? []),
      error: () => this.squads.set([]),
    });
    this.positionsService.getLookup().subscribe({
      next: (res) => this.positions.set(res.data?.items ?? []),
      error: () => this.positions.set([]),
    });
  }

  /** Commit the staged filters and reload from the first page. */
  applyFilters(): void {
    this.appliedSearch = this.search.trim();
    this.appliedSquad = this.squadFilter;
    this.appliedPosition = this.positionFilter;
    this.appliedStatus = this.statusFilter;
    this.page.set(1);
    this.loadEmployees();
  }

  get pagedEmployees(): EmployeeListItemDto[] {
    if (this.appliedStatus === 'departing') {
      const start = (this.page() - 1) * this.pageSize;
      return this.employees().slice(start, start + this.pageSize);
    }
    return this.employees();
  }

  get totalFiltered(): number {
    return this.appliedStatus === 'departing'
      ? this.employees().length
      : this.totalCount();
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
    this.loadEmployees();
  }

  previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  openEmployee(employee: EmployeeListItemDto): void {
    this.router.navigate(['/console/admin/employees', employee.id]);
  }
}
