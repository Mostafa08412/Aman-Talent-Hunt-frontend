import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { JobCardComponent } from '../job-card/job-card.component';
import { PublicJobPostListItemDto } from '@core/models/job-post-model';
import { EmploymentType, JobType, Location, SeniorityLevel } from '@core/models/enums';
import { JobsSearchPayload } from '../jobs-search/jobs-search.component';
import { JobsFiltersPayload } from '../jobs-filters/jobs-filters.component';

interface MockJobPost extends PublicJobPostListItemDto {
  department: string;
  featured?: boolean;
}

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [CommonModule, Paginator, JobCardComponent],
  templateUrl: './job-list.component.html',
  styleUrl: './job-list.component.scss'
})
export class JobsListComponent implements OnChanges {
  @Input() search: JobsSearchPayload | null = null;
  @Input() filters: JobsFiltersPayload | null = null;

  // Pagination state
  first = 0;
  rows = 3;

  // Full list (replace with API data later)
  allJobs: MockJobPost[] = [
    {
      id: '1',
      title: 'Senior Credit Risk Analyst',
      description: null,
      location: Location.Cairo,
      jobType: JobType.Hybrid,
      employmentType: EmploymentType.FullTime,
      seniorityLevel: SeniorityLevel.Senior,
      createdAtUTC: new Date().toISOString(),
      department: 'Consumer Finance',
      featured: true
    },
    {
      id: '2',
      title: '.NET Backend Engineer',
      description: null,
      location: Location.Cairo,
      jobType: JobType.Remote,
      employmentType: EmploymentType.FullTime,
      seniorityLevel: SeniorityLevel.Senior,
      createdAtUTC: new Date().toISOString(),
      department: 'Engineering & IT'
    },
    {
      id: '3',
      title: 'Product Manager - E-Wallets',
      description: null,
      location: Location.Alexandria,
      jobType: JobType.OnSite,
      employmentType: EmploymentType.FullTime,
      seniorityLevel: SeniorityLevel.Senior,
      createdAtUTC: new Date().toISOString(),
      department: 'Digital Payments'
    },
    {
      id: '4',
      title: 'Frontend Angular Developer',
      description: null,
      location: Location.Cairo,
      jobType: JobType.Hybrid,
      employmentType: EmploymentType.FullTime,
      seniorityLevel: SeniorityLevel.Junior,
      createdAtUTC: new Date().toISOString(),
      department: 'Engineering & IT'
    },
    {
      id: '5',
      title: 'Microfinance Credit Officer',
      description: null,
      location: Location.Alexandria,
      jobType: JobType.OnSite,
      employmentType: EmploymentType.FullTime,
      seniorityLevel: SeniorityLevel.Junior,
      createdAtUTC: new Date().toISOString(),
      department: 'Microfinance'
    },
    {
      id: '6',
      title: 'UX Designer',
      description: null,
      location: Location.Cairo,
      jobType: JobType.Remote,
      employmentType: EmploymentType.FullTime,
      seniorityLevel: SeniorityLevel.Senior,
      createdAtUTC: new Date().toISOString(),
      department: 'Digital Payments'
    }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['search'] || changes['filters']) {
      this.first = 0;
    }
  }

  get filteredJobs(): MockJobPost[] {
    let list = [...this.allJobs];

    const term = this.search?.search?.toLowerCase();
    if (term) {
      list = list.filter((j) => (j.title ?? '').toLowerCase().includes(term));
    }

    if (this.search?.location) {
      list = list.filter((j) => j.location === this.search!.location);
    }

    const departments = this.filters?.departments ?? [];
    if (departments.length) {
      list = list.filter((j) => departments.includes(j.department));
    }

    const employmentTypes = this.filters?.employmentTypes ?? [];
    if (employmentTypes.length) {
      list = list.filter((j) => employmentTypes.includes(j.employmentType));
    }

    return list;
  }

  get totalRecords(): number {
    return this.filteredJobs.length;
  }

  get jobs(): MockJobPost[] {
    return this.filteredJobs.slice(this.first, this.first + this.rows);
  }

  onPageChange(event: PaginatorState): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
  }
}