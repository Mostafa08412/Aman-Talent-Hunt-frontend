import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

import { JOB_REQUISITION_API } from '../../../core/services/job-requisition-api';
import type { JobRequisitionListItemDto, JobRequisitionListQuery } from '../../../core/models/job-requisition-model';
import { JobRequisitionStatus } from '../../../core/models/job-requisition-model';
import { HiringType } from '../../../core/models/enums';
import { Role } from '../../../core/models/role.model';
import { AuthService } from '../../../core/services/auth.service';
import { LookupItemDto } from '../../../core/models/lookup-model';

type RequisitionView = 'all' | 'assigned' | 'pendingMyApproval' | 'pendingMyModification';

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
  ],
  templateUrl: './job-req-list.component.html',
  styleUrl: './job-req-list.component.scss',
})
export class JobReqListComponent implements OnInit {
  private api = inject(JOB_REQUISITION_API);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private auth = inject(AuthService);

  /**
   * Tabs adapt to the caller's role:
   *  - Hiring Manager — Pending My Approval / Needs My Fix / Mine (HM owns the
   *    requisitions, so the plain list is "mine"; the Assigned tab is not for them).
   *  - Department Head — Pending My Approval / Assigned (the assigned scope IS the
   *    department's requisitions, so "All" would be a duplicate; no fix queue).
   *  - Everyone else (Recruiter / HR Manager / SuperAdmin) — Pending My Approval /
   *    Needs My Fix / Assigned / All.
   */
  readonly viewTabs = computed<ViewTab[]>(() => {
    const role = this.auth.currentUser()?.role;
    if (role === Role.HiringManager) {
      return [
        { value: 'pendingMyApproval', label: 'Pending My Approval', icon: 'pi pi-clock' },
        { value: 'pendingMyModification', label: 'Needs My Fix', icon: 'pi pi-exclamation-circle' },
        { value: 'all', label: 'Mine', icon: 'pi pi-briefcase' },
      ];
    }
    if (role === Role.DepartmentHead) {
      return [
        { value: 'pendingMyApproval', label: 'Pending My Approval', icon: 'pi pi-clock' },
        { value: 'pendingMyModification', label: 'Requested Modifications', icon: 'pi pi-exclamation-circle' },
        { value: 'assigned', label: 'Assigned', icon: 'pi pi-briefcase' },
      ];
    }
    return [
      { value: 'pendingMyApproval', label: 'Pending My Approval', icon: 'pi pi-clock' },
      { value: 'pendingMyModification', label: 'Needs My Fix', icon: 'pi pi-exclamation-circle' },
      { value: 'assigned', label: 'Assigned', icon: 'pi pi-briefcase' },
    ];
  });

  /** Active view is resolved from the active route so each sidebar item / tab lives at
      its own URL. Defaults to "All" until the route data arrives. */
  activeView = signal<RequisitionView>('all');

  /** Only the Hiring Manager can create requisitions (route guard enforces too). */
  readonly canCreateRequisition = computed(() => this.auth.hasRole(Role.HiringManager));
  requisitions = signal<JobRequisitionListItemDto[]>([]);
  departments = signal<LookupItemDto[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);

  /* Filters — staged until Apply commits them. */
  searchFilter: string | null = null;
  statusFilter: JobRequisitionStatus | null = null;
  departmentFilter: string | null = null;
  hiringTypeFilter: HiringType | null = null;

  private appliedSearch: string | null = null;
  private appliedStatus: JobRequisitionStatus | null = null;
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
    this.route.data.subscribe((data) => {
      const view = data['view'] as RequisitionView | undefined;
      const next = view && this.viewTabs().some((t) => t.value === view) ? view : 'all';
      this.activeView.set(next);
      this.page.set(1);
      this.loadRequisitions();
    });
    this.api.getDepartmentOptions({ PageSize: 100 }).subscribe({
      next: (res) => this.departments.set(res.data?.items ?? []),
      error: () => this.departments.set([]),
    });
  }

  switchView(view: RequisitionView): void {
    if (this.activeView() === view || !this.viewTabs().some((t) => t.value === view)) {
      return;
    }
    this.router.navigate([VIEW_ROUTES[view]]);
  }

  loadRequisitions(): void {
    this.isLoading.set(true);

    const query: JobRequisitionListQuery = {
      search: this.appliedSearch ?? undefined,
      status: this.appliedStatus ?? undefined,
      departmentId: this.appliedDepartment ?? undefined,
      hiringType: this.appliedHiringType ?? undefined,
      page: this.page(),
      pageSize: this.pageSize,
      sortBy: 'createdAtUTC',
      sortAscending: false,
    };

    const request$ =
      this.activeView() === 'pendingMyApproval'
        ? this.api.getPendingApprovals(query)
        : this.activeView() === 'pendingMyModification'
          ? this.api.getPendingModifications(query)
          : this.activeView() === 'assigned'
            ? this.api.getAssigned(query)
            : this.api.getList(query);

    request$.subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
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

  openRequisition(requisition: JobRequisitionListItemDto): void {
    this.router.navigate(['/console/job-requisitions', requisition.id]);
  }

  typeLabel(type: string): string {
    return humanize(type);
  }

  statusLabel(status: JobRequisitionStatus): string {
    return humanize(status);
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

const ENUM_ABBREVIATIONS: Record<string, string> = { JD: 'Job Description' };

/** Maps each queue view to its sidebar-mapped route under /console/job-requisitions. */
const VIEW_ROUTES: Record<RequisitionView, string> = {
  all: '/console/job-requisitions',
  pendingMyApproval: '/console/job-requisitions/pending-approval',
  pendingMyModification: '/console/job-requisitions/needs-fix',
  assigned: '/console/job-requisitions/assigned',
};

/**
 * Humanizes backend enum wire values for display:
 *  - PascalCase (e.g. "PendingAttachingJD", "OnHold") → "Pending Attaching JD" …
 *  - SCREAMING_SNAKE (e.g. "HIRING_MANAGER") → "Hiring Manager"
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
