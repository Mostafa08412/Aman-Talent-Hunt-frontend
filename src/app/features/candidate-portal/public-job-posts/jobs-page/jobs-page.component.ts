import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobsHeroComponent } from './jobs-hero/jobs-hero.component';
import { JobsListComponent } from './job-list/job-list.component';
import { JobsSearchComponent, JobsSearchPayload } from './jobs-search/jobs-search.component';
import { JobsFiltersComponent, JobsFiltersPayload } from './jobs-filters/jobs-filters.component';


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
  // Stats (can later come from API)
  openRoles = 38;
  businessUnits = 12;
  teamMembers = '1.2K+';

  search: JobsSearchPayload | null = null;
  filters: JobsFiltersPayload | null = null;

  onSearch(payload: JobsSearchPayload): void {
    this.search = payload;
  }

  onFiltersChange(payload: JobsFiltersPayload): void {
    this.filters = payload;
  }
}
