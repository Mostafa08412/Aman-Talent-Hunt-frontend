import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';

interface RefreshJob {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  level: string;
  posted: string;
  featured: boolean;
}

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-jobs-refresh',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    TagModule,
  ],
  templateUrl: './jobs-refresh.component.html',
  styleUrl: './jobs-refresh.component.scss',
})
export class JobsRefreshComponent {
  openRoles = 38;
  businessUnits = 12;
  teamMembers = '1.2K+';

  locationOptions: FilterOption[] = [
    { label: 'All Cities', value: '' },
    { label: 'Cairo', value: 'Cairo' },
    { label: 'Alexandria', value: 'Alexandria' },
    { label: 'Remote', value: 'Remote' },
  ];

  departmentOptions: FilterOption[] = [
    { label: 'Consumer Finance', value: 'Consumer Finance' },
    { label: 'Microfinance', value: 'Microfinance' },
    { label: 'Digital Payments', value: 'Digital Payments' },
    { label: 'Engineering & IT', value: 'Engineering & IT' },
  ];

  typeOptions: FilterOption[] = [
    { label: 'Full-Time', value: 'Full-Time' },
    { label: 'Part-Time', value: 'Part-Time' },
    { label: 'Internship', value: 'Internship' },
  ];

  allJobs: RefreshJob[] = [
    { id: 'pm-payments', title: 'Senior Product Manager - Payments', department: 'Product Management', location: 'Cairo', type: 'Full-Time', level: 'Mid-Senior', posted: '2 days ago', featured: true },
    { id: 'fe-angular', title: 'Frontend Engineer (Angular)', department: 'Engineering & IT', location: 'Cairo', type: 'Full-Time', level: 'Mid-Senior', posted: '3 days ago', featured: true },
    { id: 'risk-analyst', title: 'Credit Risk Analyst', department: 'Consumer Finance', location: 'Cairo', type: 'Full-Time', level: 'Mid-Senior', posted: '1 week ago', featured: false },
    { id: 'microfinance-ops', title: 'Microfinance Operations Officer', department: 'Microfinance', location: 'Alexandria', type: 'Full-Time', level: 'Entry', posted: '1 week ago', featured: false },
    { id: 'flutter-dev', title: 'Mobile Developer (Flutter)', department: 'Engineering & IT', location: 'Remote', type: 'Full-Time', level: 'Mid-Senior', posted: '5 days ago', featured: true },
    { id: 'payments-spec', title: 'Digital Payments Specialist', department: 'Digital Payments', location: 'Cairo', type: 'Full-Time', level: 'Mid-Senior', posted: '2 days ago', featured: false },
    { id: 'data-analyst', title: 'Data Analyst', department: 'Engineering & IT', location: 'Cairo', type: 'Full-Time', level: 'Entry', posted: '1 week ago', featured: false },
    { id: 'ux-designer', title: 'UX Designer', department: 'Digital Payments', location: 'Remote', type: 'Part-Time', level: 'Mid-Senior', posted: '4 days ago', featured: false },
  ];

  keyword = signal('');
  selectedLocation = signal<string | null>(null);

  selectedDepartments = signal<Record<string, boolean>>({
    'Consumer Finance': false,
    'Microfinance': false,
    'Digital Payments': false,
    'Engineering & IT': false,
  });

  selectedTypes = signal<Record<string, boolean>>({
    'Full-Time': false,
    'Part-Time': false,
    'Internship': false,
  });

  filteredJobs = computed(() => {
    const kw = this.keyword().trim().toLowerCase();
    const loc = this.selectedLocation();
    const depts = this.selectedDepartments();
    const types = this.selectedTypes();

    return this.allJobs.filter((job) => {
      if (kw && !job.title.toLowerCase().includes(kw) && !job.department.toLowerCase().includes(kw)) {
        return false;
      }
      if (loc && job.location !== loc) return false;
      if (Object.values(depts).some(Boolean) && !depts[job.department]) return false;
      if (Object.values(types).some(Boolean) && !types[job.type]) return false;
      return true;
    });
  });

  resultLabel = computed(() => {
    const n = this.filteredJobs().length;
    return `${n} role${n === 1 ? '' : 's'} found`;
  });

  toggleDepartment(value: string, checked: boolean): void {
    this.selectedDepartments.update((m) => ({ ...m, [value]: checked }));
  }

  toggleType(value: string, checked: boolean): void {
    this.selectedTypes.update((m) => ({ ...m, [value]: checked }));
  }

  resetFilters(): void {
    this.keyword.set('');
    this.selectedLocation.set(null);
    this.selectedDepartments.set(
      Object.fromEntries(Object.keys(this.selectedDepartments()).map((k) => [k, false])),
    );
    this.selectedTypes.set(
      Object.fromEntries(Object.keys(this.selectedTypes()).map((k) => [k, false])),
    );
  }
}