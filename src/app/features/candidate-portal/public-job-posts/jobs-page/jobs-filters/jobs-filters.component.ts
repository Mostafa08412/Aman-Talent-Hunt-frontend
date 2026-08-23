import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { EmploymentType } from '@core/models';

export interface JobsFiltersPayload {
  departments: string[];
  employmentTypes: EmploymentType[];
}

interface FilterOption<T> {
  label: string;
  value: T;
  checked: boolean;
}

@Component({
  selector: 'app-jobs-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxModule],
  templateUrl: './jobs-filters.component.html',
  styleUrl: './jobs-filters.component.scss'
})
export class JobsFiltersComponent {
  @Output() filtersChange = new EventEmitter<JobsFiltersPayload>();

  departmentOptions: FilterOption<string>[] = [
    { label: 'All Departments', value: '', checked: true },
    { label: 'Consumer Finance', value: 'Consumer Finance', checked: false },
    { label: 'Microfinance', value: 'Microfinance', checked: false },
    { label: 'Digital Payments', value: 'Digital Payments', checked: false },
    { label: 'Engineering & IT', value: 'Engineering & IT', checked: false }
  ];

  employmentOptions: FilterOption<EmploymentType>[] = [
    { label: 'Full-Time', value: EmploymentType.FullTime, checked: false },
    { label: 'Part-Time', value: EmploymentType.PartTime, checked: false },
    { label: 'Internship', value: EmploymentType.Intern, checked: false }
  ];

  onDepartmentChange(option: FilterOption<string>): void {
    if (option.value === '') {
      this.departmentOptions.forEach((o) => (o.checked = o.value === ''));
    } else {
      const all = this.departmentOptions.find((o) => o.value === '');
      if (all) all.checked = false;
    }
    this.onFilterChange();
  }

  onFilterChange(): void {
    this.filtersChange.emit({
      departments: this.departmentOptions
        .filter((o) => o.checked && o.value !== '')
        .map((o) => o.value),
      employmentTypes: this.employmentOptions
        .filter((o) => o.checked)
        .map((o) => o.value)
    });
  }

  clearAll(): void {
    this.departmentOptions.forEach((o) => (o.checked = o.value === ''));
    this.employmentOptions.forEach((o) => (o.checked = false));
    this.onFilterChange();
  }
}