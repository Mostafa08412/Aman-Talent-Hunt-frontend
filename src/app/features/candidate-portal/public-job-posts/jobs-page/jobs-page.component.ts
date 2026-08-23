import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobsHeroComponent } from './jobs-hero/jobs-hero.component';
import { JobsListComponent, PageChangeEvent } from './job-list/job-list.component';
import { JobsSearchComponent, JobsSearchPayload } from './jobs-search/jobs-search.component';
import { JobsFiltersComponent, JobsFiltersPayload } from './jobs-filters/jobs-filters.component';
import { JobPostService } from '@core/services/job-post.service';
import { PublicJobPostListItemDto } from '@core/models/job-post-model';

const EMPTY_FILTERS: JobsFiltersPayload = {
  employmentType: null,
  seniorityLevel: null,
  jobType: null,
};

@Component({
  selector: 'app-jobs-page',
  standalone: true,
  imports: [
    CommonModule,
    JobsHeroComponent,
    JobsSearchComponent,
    JobsFiltersComponent,
    JobsListComponent
  ],
  templateUrl: './jobs-page.component.html',
  styleUrl: './jobs-page.component.scss'
})
export class JobsPageComponent {
  private jobPostService = inject(JobPostService);

  // Static marketing stats (no API yet)
  businessUnits = 12;
  teamMembers = '1.2K+';

  isLoading = signal(false);
  jobs = signal<PublicJobPostListItemDto[]>([]);
  totalCount = signal(0);
  page = signal(1);
  rows = 6;

  // Latest values from the UI; only applied to the query when
  // "Search Roles" is pressed (or the page changes).
  private pendingSearch: JobsSearchPayload = {
    search: '',
    location: null,
    departmentId: null,
  };
  private pendingFilters: JobsFiltersPayload = { ...EMPTY_FILTERS };

  // Values used by the current/next request.
  private appliedSearch: JobsSearchPayload = {
    search: '',
    location: null,
    departmentId: null,
  };
  private appliedFilters: JobsFiltersPayload = { ...EMPTY_FILTERS };

  constructor() {
    this.load();
  }

  onSearchInput(payload: JobsSearchPayload): void {
    this.pendingSearch = payload;
  }

  onFiltersChange(payload: JobsFiltersPayload): void {
    // Sidebar filters are sent with the request immediately.
    this.pendingFilters = payload;
    this.appliedFilters = payload;
    this.page.set(1);
    this.load();
  }

  /** Triggered by the "Search Roles" button: applies pending values. */
  onApplyFilters(): void {
    this.appliedSearch = this.pendingSearch;
    this.appliedFilters = this.pendingFilters;
    this.page.set(1);
    this.load();
  }

  onPageChange(event: PageChangeEvent): void {
    this.page.set(event.page + 1);
    this.rows = event.rows;
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.jobPostService
      .getPublicList({
        Search: this.appliedSearch.search || undefined,
        Location: this.appliedSearch.location ?? undefined,
        DepartmentId: this.appliedSearch.departmentId ?? undefined,
        EmploymentType: this.appliedFilters.employmentType ?? undefined,
        SeniorityLevel: this.appliedFilters.seniorityLevel ?? undefined,
        JobType: this.appliedFilters.jobType ?? undefined,
        SortBy: 'createdAtUTC',
        SortAscending: false,
        Page: this.page(),
        PageSize: this.rows,
      })
      .subscribe({
        next: (result) => {
          const paged = result.data;
          this.jobs.set(paged?.items ?? []);
          this.totalCount.set(paged?.totalCount ?? 0);
          this.isLoading.set(false);
        },
        error: () => {
          this.jobs.set([]);
          this.totalCount.set(0);
          this.isLoading.set(false);
        },
      });
  }
}
