import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { JobCardComponent } from '../job-card/job-card.component';
import { PublicJobPostListItemDto } from '@core/models/job-post-model';

export interface PageChangeEvent {
  page: number; // zero-based
  rows: number;
}

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [CommonModule, Paginator, JobCardComponent],
  templateUrl: './job-list.component.html',
  styleUrl: './job-list.component.scss'
})
export class JobsListComponent {
  @Input({ required: true }) jobs: PublicJobPostListItemDto[] = [];
  @Input({ required: true }) totalRecords = 0;
  @Input() first = 0;
  @Input({ required: true }) rows = 6;
  @Input() isLoading = false;

  @Output() pageChange = new EventEmitter<PageChangeEvent>();

  onPageChange(event: PaginatorState): void {
    this.pageChange.emit({ page: event.page ?? 0, rows: event.rows ?? this.rows });
  }
}
