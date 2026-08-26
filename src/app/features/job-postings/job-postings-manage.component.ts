import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
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
import { CreateJobPostDialogComponent } from './create-job-post-dialog.component';

interface EnumOption {
  label: string;
  value: string;
}

function enumToOptions(e: Record<string, string>): EnumOption[] {
  return Object.values(e).map((v) => ({ label: humanizeEnum(v), value: v }));
}

@Component({
  selector: 'app-job-postings-manage',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    StatusBadgeComponent,
    CreateJobPostDialogComponent,
  ],
  templateUrl: './job-postings-manage.component.html',
  styleUrl: './job-postings-manage.component.scss',
})
export class JobPostingsManageComponent implements OnInit {
  private readonly jobPostsService = inject(AdminJobPostsService);
  private readonly departmentsService = inject(AdminDepartmentsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly posts = signal<AdminJobPostListItemDto[]>([]);
  readonly departments = signal<LookupItemDto[]>([]);

  readonly isLoading = signal(false);
  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly pageSize = 10;

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

  createDialogVisible = false;

  // Enum option sets for the filter dropdowns
  readonly statusOptions = enumToOptions(JobPostStatus);
  readonly employmentTypeOptions = enumToOptions(EmploymentType);
  readonly seniorityOptions = enumToOptions(SeniorityLevel);
  readonly locationOptions = enumToOptions(Location);
  readonly jobTypeOptions = enumToOptions(JobType);
  readonly visibilityOptions = enumToOptions(PostingVisibility);

  readonly canCreate = this.authService.hasRole(Role.Recruiter);

  ngOnInit(): void {
    this.loadPosts();
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
      EmploymentType: v.employmentType ?? undefined,
      SeniorityLevel: v.seniorityLevel ?? undefined,
      Location: v.location ?? undefined,
      JobType: v.jobType ?? undefined,
      Visibility: v.visibility ?? undefined,
    };

    this.jobPostsService.getList(params).subscribe({
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

  onCreated(detailId: string): void {
    this.createDialogVisible = false;
    // Navigate straight to the new post's detail page (guide §3 step 3).
    this.router.navigate(['/console/postings', detailId]);
  }

  referenceCode(post: AdminJobPostListItemDto): string {
    return post.referenceNumber || post.id.slice(0, 8).toUpperCase();
  }
}
