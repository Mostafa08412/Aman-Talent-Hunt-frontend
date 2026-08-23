import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Location } from '@core/models';
import { JobPostService } from '@core/services/job-post.service';

export interface JobsSearchPayload {
  search: string;
  location: Location | null;
  departmentId: string | null;
}

@Component({
  selector: 'app-jobs-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './jobs-search.component.html',
  styleUrl: './jobs-search.component.scss'
})
export class JobsSearchComponent implements OnInit {
  @Output() search = new EventEmitter<JobsSearchPayload>();
  @Output() apply = new EventEmitter<void>();

  private jobPostService = inject(JobPostService);

  keyword = '';
  selectedLocation: Location | null = null;
  selectedDepartmentId: string | null = null;

  locationOptions = Object.values(Location).map((value) => ({ label: value, value }));
  departmentOptions: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.jobPostService.getDepartmentLookup().subscribe({
      next: (result) => {
        this.departmentOptions = (result.data ?? []).map((d) => ({
          label: d.name ?? d.id,
          value: d.id,
        }));
      },
      error: () => {
        // Leave the dropdown empty; searching without it stays functional.
        this.departmentOptions = [];
      },
    });
  }

  onInput(): void {
    this.search.emit({
      search: this.keyword.trim(),
      location: this.selectedLocation,
      departmentId: this.selectedDepartmentId
    });
  }

  onApply(): void {
    this.onInput();
    this.apply.emit();
  }
}
