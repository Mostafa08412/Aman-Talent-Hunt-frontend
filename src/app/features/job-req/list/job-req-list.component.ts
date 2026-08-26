import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { JOB_REQUISITION_API } from '../../../core/services/job-requisition-api';
import type { JobRequisitionListQuery, JobRequisitionSummary, RequisitionView } from '../../../core/models/job-requisition-model';
import { JobRequisitionStatus } from '../../../core/models/job-requisition-model';
import { HiringType } from '../../../core/models/enums';
import { LookupItemDto } from '../../../core/models/lookup-model';

interface ViewTab {
  value: RequisitionView;
  label: string;
  icon: string;
}

interface FilterOption<T> {
  label: string;
  value: T | null;
}

@Component({
  selector: 'app-job-req-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    InputTextModule,
    MultiSelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './job-req-list.component.html',
  styleUrl: './job-req-list.component.scss',
})
export class JobReqListComponent implements OnInit {
  private api = inject(JOB_REQUISITION_API);
  private router = inject(Router);
  private messageService = inject(MessageService);

  readonly viewTabs: ViewTab[] = [
    { value: 'mine', label: 'Mine', icon: 'pi pi-user' },
    { value: 'pendingMyApproval', label: 'Pending My Approval', icon: 'pi pi-clock' },
    { value: 'pendingMyModification', label: 'Needs My Fix', icon: 'pi pi-exclamation-circle' },
    { value: 'assignedToMySquad', label: 'Squad Queue', icon: 'pi pi-inbox' },
    { value: 'ownedByMySquad', label: 'Squad Postings', icon: 'pi pi-briefcase' },
    { value: 'departmentAll', label: 'Department', icon: 'pi pi-building' },
    { value: 'all', label: 'All', icon: 'pi pi-globe' },
  ];

  activeView = signal<RequisitionView>('mine');

  requisitions = signal<JobRequisitionSummary[]>([]);
  departments = signal<LookupItemDto[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);

  /* Filters — staged until Apply commits them. */
  searchFilter: string | null = null;
  statusFilter: JobRequisitionStatus[] | null = null;
  departmentFilter: string | null = null;
  hiringTypeFilter: HiringType | null = null;

  private appliedSearch: string | null = null;
  private appliedStatus: JobRequisitionStatus[] | null = null;
  private appliedDepartment: string | null = null;
  private appliedHiringType: HiringType | null = null;

  readonly statusOptions: FilterOption<JobRequisitionStatus>[] =
    Object.values(JobRequisitionStatus).map((status) => ({ label: humanize(status), value: status }));

  readonly hiringTypeOptions: FilterOption<HiringType>[] =
    Object.values(HiringType).map((type) => ({ label: humanize(type), value: type }));

  /* Pagination */
  page = signal(1);
  readonly pageSize = 10;

  ngOnInit(): void {
    this.loadRequisitions();
    this.api.getDepartmentOptions().subscribe({
      next: (res) => this.departments.set(res.data ?? []),
      error: () => this.departments.set([]),
    });
  }

  switchView(view: RequisitionView): void {
    if (this.activeView() === view) return;
    this.activeView.set(view);
    this.page.set(1);
    this.loadRequisitions();
  }

  loadRequisitions(): void {
    this.isLoading.set(true);

    const query: JobRequisitionListQuery = {
      view: this.activeView(),
      search: this.appliedSearch ?? undefined,
      status: this.appliedStatus ?? undefined,
      departmentId: this.appliedDepartment ?? undefined,
      hiringType: this.appliedHiringType ?? undefined,
      page: this.page(),
      pageSize: this.pageSize,
      sortBy: 'updatedAtUTC',
      sortDir: 'desc',
    };

    this.api.getList(query).subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message ?? 'Failed to load requisitions.' });
          this.requisitions.set([]);
          this.totalCount.set(0);
        } else {
          this.requisitions.set(res.data?.items ?? []);
          this.totalCount.set(res.data?.totalCount ?? 0);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load requisitions.' });
      },
    });
  }

  applyFilters(): void {
    this.appliedSearch = this.searchFilter;
    this.appliedStatus = this.statusFilter;
    this.appliedDepartment = this.departmentFilter;
    this.appliedHiringType = this.hiringTypeFilter;
    this.page.set(1);
    this.loadRequisitions();
  }

  clearFilters(): void {
    this.searchFilter = null;
    this.statusFilter = null;
    this.departmentFilter = null;
    this.hiringTypeFilter = null;
    this.applyFilters();
  }

  openRequisition(requisition: JobRequisitionSummary): void {
    this.router.navigate(['/console/job-requisitions', requisition.id]);
  }

  typeLabel(type: string): string {
    return humanize(type);
  }

  statusLabel(status: JobRequisitionStatus): string {
    return humanize(status);
  }

  approverLabel(requisition: JobRequisitionSummary): string {
    if (!requisition.currentApproverRole) return '—';
    const role = humanize(requisition.currentApproverRole);
    return requisition.currentApproverName ? `${role} · ${requisition.currentApproverName}` : role;
  }

  statusSeverity(status: JobRequisitionStatus): string {
    switch (status) {
      case JobRequisitionStatus.Approved:
      case JobRequisitionStatus.Published:
      case JobRequisitionStatus.Fulfilled:
        return 'success';
      case JobRequisitionStatus.Rejected:
        return 'danger';
      case JobRequisitionStatus.OnHold:
      case JobRequisitionStatus.Closed:
        return 'warning';
      case JobRequisitionStatus.Draft:
        return 'neutral';
      default:
        return 'info';
    }
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

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
