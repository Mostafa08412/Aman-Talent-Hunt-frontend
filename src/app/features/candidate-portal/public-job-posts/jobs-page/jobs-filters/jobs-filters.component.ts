import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';
import {
  EmploymentType,
  JobType,
  SeniorityLevel,
} from '@core/models';

export interface JobsFiltersPayload {
  employmentType: EmploymentType | null;
  seniorityLevel: SeniorityLevel | null;
  jobType: JobType | null;
}

interface FilterOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-jobs-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, RadioButtonModule],
  templateUrl: './jobs-filters.component.html',
  styleUrl: './jobs-filters.component.scss'
})
export class JobsFiltersComponent {
  @Output() filtersChange = new EventEmitter<JobsFiltersPayload>();

  employmentOptions: FilterOption<EmploymentType>[] = [
    { label: 'Full-Time', value: EmploymentType.FullTime },
    { label: 'Part-Time', value: EmploymentType.PartTime },
    { label: 'Contract', value: EmploymentType.Contract },
    { label: 'Internship', value: EmploymentType.Intern }
  ];

  seniorityOptions: FilterOption<SeniorityLevel>[] = [
    { label: 'Intern', value: SeniorityLevel.Intern },
    { label: 'Fresh', value: SeniorityLevel.Fresh },
    { label: 'Junior', value: SeniorityLevel.Junior },
    { label: 'Senior', value: SeniorityLevel.Senior }
  ];

  jobTypeOptions: FilterOption<JobType>[] = [
    { label: 'On-site', value: JobType.OnSite },
    { label: 'Hybrid', value: JobType.Hybrid },
    { label: 'Remote', value: JobType.Remote }
  ];

  selectedEmployment: EmploymentType | null = null;
  selectedSeniority: SeniorityLevel | null = null;
  selectedJobType: JobType | null = null;

  setEmployment(value: EmploymentType | null): void {
    this.selectedEmployment = value;
    this.emitFilters();
  }

  setSeniority(value: SeniorityLevel | null): void {
    this.selectedSeniority = value;
    this.emitFilters();
  }

  setJobType(value: JobType | null): void {
    this.selectedJobType = value;
    this.emitFilters();
  }

  clearAll(): void {
    this.selectedEmployment = null;
    this.selectedSeniority = null;
    this.selectedJobType = null;
    this.emitFilters();
  }

  reset(): void {
    this.clearAll();
  }

  emitFilters(): void {
    this.filtersChange.emit({
      employmentType: this.selectedEmployment,
      seniorityLevel: this.selectedSeniority,
      jobType: this.selectedJobType
    });
  }
}
