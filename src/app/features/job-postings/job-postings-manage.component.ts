import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import {
  AdminJobPostsQueryParams,
  AdminJobPostsService,
} from '@core/services/admin-job-posts.service';
import { AdminDepartmentsService } from '@core/services/admin-departments.service';
import { AuthService } from '@core/services/auth.service';
import { Role } from '@core/models/role.model';

import {
  AdminJobPostListItemDto,
} from '@core/models/admin-job-post-model';
import {
  EmploymentType,
  JobPostStatus,
  JobType,
  Location,
  PostingVisibility,
  SeniorityLevel,
} from '@core/models/enums';
import { LookupItemDto } from '@core/models/lookup-model';

import { StatusBadgeComponent, humanizeEnum } from './shared/status-badge.component';

interface EnumOption {
  label: string;
  value: string;
}

type JobPostsView = 'all' | 'assigned';

function enumToOptions(e: Record<string, string>): EnumOption[] {
  return Object.values(e).map((v) => ({ label: humanizeEnum(v), value: v }));
}

@Component({
  selector: 'app-job-postings-manage',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    StatusBadgeComponent,
  ],
  templateUrl: './job-postings-manage.component.html',
  styleUrl: './job-postings-manage.component.scss',
})
export class JobPostingsManageComponent implements OnInit {
  private readonly jobPostsService = inject(AdminJobPostsService);
  private readonly departmentsService = inject(AdminDepartmentsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly posts = signal<AdminJobPostListItemDto[]>([]);
  readonly departments = signal<LookupItemDto[]>([]);

  readonly isLoading = signal(false);
  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly pageSize = 10;

  /** Recruiters and hiring managers can scope the list to posts assigned to them (OwnerId). */
  readonly isRecruiter = computed(() => this.authService.hasRole(Role.Recruiter));
  readonly isHiringManager = computed(() => this.authService.hasRole(Role.HiringManager));
  /** Active view is resolved from the active route so each sidebar item / tab lives at its own URL. */
  readonly view = signal<JobPostsView>('all');

  selectView(view: JobPostsView): void {
    if (view === this.view()) return;
    this.router.navigate([VIEW_ROUTES[view]]);
  }

  readonly filterForm = this.fb.group({
    search: [''],
    status: this.fb.control<JobPostStatus | null>(null),
    departmentId: this.fb.control<string | null>(null),
    employmentType: this.fb.control<EmploymentType | null>(null),
    seniorityLevel: this.fb.control<SeniorityLevel | null>(null),
    location: this.fb.control<Location | null>(null),
    jobType: this.fb.control<JobType | null>(null),
    visibility: this.fb.control<PostingVisibility | null>(null),
  });

  // Enum option sets for the filter dropdowns
  readonly statusOptions = enumToOptions(JobPostStatus);
  readonly employmentTypeOptions = enumToOptions(EmploymentType);
  readonly seniorityOptions = enumToOptions(SeniorityLevel);
  readonly locationOptions = enumToOptions(Location);
  readonly jobTypeOptions = enumToOptions(JobType);
  readonly visibilityOptions = enumToOptions(PostingVisibility);

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const next = data['view'] === 'assigned' ? 'assigned' : 'all';
      if (next !== this.view()) {
        this.view.set(next);
        this.page.set(1);
      }
      this.loadPosts();
    });
    this.loadDepartments();
  }

  private loadDepartments(): void {
    this.departmentsService.getLookup({ PageSize: 100 }).subscribe({
      next: (res) => this.departments.set(res.data?.items ?? []),
      error: () => this.departments.set([]),
    });
  }

  loadPosts(): void {
    this.isLoading.set(true);
    const v = this.filterForm.getRawValue();

    const params: AdminJobPostsQueryParams = {
      Page: this.page(),
      PageSize: this.pageSize,
      Search: v.search?.trim() || undefined,
      Status: v.status ?? undefined,
      DepartmentId: v.departmentId ?? undefined,
      OwnerId:
        this.view() === 'assigned' && !this.isHiringManager()
          ? this.authService.currentUser()?.id
          : undefined,
      EmploymentType: v.employmentType ?? undefined,
      SeniorityLevel: v.seniorityLevel ?? undefined,
      Location: v.location ?? undefined,
      JobType: v.jobType ?? undefined,
      Visibility: v.visibility ?? undefined,
    };

    // Hiring managers always get their own scoped list from the dedicated endpoint.
    const request$ = this.isHiringManager()
      ? this.jobPostsService.getHiringManagerPosts(params)
      : this.jobPostsService.getList(params);

    request$.subscribe({
      next: (res) => {
        this.posts.set(res.data?.items ?? []);
        this.totalCount.set(res.data?.totalCount ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.posts.set([]);
        this.totalCount.set(0);
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadPosts();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: null,
      departmentId: null,
      employmentType: null,
      seniorityLevel: null,
      location: null,
      jobType: null,
      visibility: null,
    });
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }

  get rangeStart(): number {
    if (this.totalCount() === 0) return 0;
    return (this.page() - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page() * this.pageSize, this.totalCount());
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page();

    if (total <= 6) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const wanted = [current - 1, current, current + 1, total].filter(
      (n) => n >= 1 && n <= total,
    );
    return [...new Set([1, ...wanted])].sort((a, b) => a - b);
  }

  goToPage(pageNumber: number): void {
    const clamped = Math.min(Math.max(1, pageNumber), this.totalPages);
    if (clamped === this.page()) return;
    this.page.set(clamped);
    this.loadPosts();
  }

  previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  openPost(post: AdminJobPostListItemDto): void {
    this.router.navigate(['/console/postings', post.id]);
  }

  referenceCode(post: AdminJobPostListItemDto): string {
    return post.referenceNumber || post.id.slice(0, 8).toUpperCase();
  }
}

/** Maps each postings view to its sidebar-mapped route under /console/postings. */
const VIEW_ROUTES: Record<JobPostsView, string> = {
  all: '/console/postings',
  assigned: '/console/postings/assigned',
};
