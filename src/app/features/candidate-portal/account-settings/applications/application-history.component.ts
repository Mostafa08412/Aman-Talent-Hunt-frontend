import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

export interface ApplicationRow {
  id: string;
  jobPostTitle: string;
  department: string;
  location: string;
  source: string;
  status: string;
  appliedAt: string;
  upcomingInterview?: string;
}

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-application-history',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, TagModule, ButtonModule, ToastModule],
  templateUrl: './application-history.component.html',
  styleUrl: './application-history.component.scss',
})
export class ApplicationHistoryComponent {
  applications = signal<ApplicationRow[]>([
    {
      id: 'app-pm-payments',
      jobPostTitle: 'Senior Product Manager - Payments',
      department: 'Product Management',
      location: 'Cairo',
      source: 'LinkedIn',
      status: 'InterviewScheduled',
      appliedAt: 'Feb 10, 2026',
      upcomingInterview: 'Mar 2, 2026',
    },
    {
      id: 'app-fe-angular',
      jobPostTitle: 'Frontend Engineer (Angular)',
      department: 'Engineering & IT',
      location: 'Cairo',
      source: 'Portal',
      status: 'Screened',
      appliedAt: 'Jan 22, 2026',
    },
    {
      id: 'app-flutter-dev',
      jobPostTitle: 'Mobile Developer (Flutter)',
      department: 'Engineering & IT',
      location: 'Remote',
      source: 'LinkedIn',
      status: 'Shortlisted',
      appliedAt: 'Jan 30, 2026',
    },
    {
      id: 'app-payments-spec',
      jobPostTitle: 'Digital Payments Specialist',
      department: 'Digital Payments',
      location: 'Cairo',
      source: 'Portal',
      status: 'Submitted',
      appliedAt: 'Feb 10, 2026',
    },
    {
      id: 'app-data-analyst',
      jobPostTitle: 'Data Analyst',
      department: 'Engineering & IT',
      location: 'Cairo',
      source: 'Wuzzuf',
      status: 'OfferExtended',
      appliedAt: 'Nov 5, 2025',
    },
    {
      id: 'app-risk-analyst',
      jobPostTitle: 'Credit Risk Analyst',
      department: 'Consumer Finance',
      location: 'Cairo',
      source: 'Wuzzuf',
      status: 'Rejected',
      appliedAt: 'Dec 10, 2025',
    },
  ]);

  statusSeverity(status: string): Severity {
    const map: Record<string, Severity> = {
      Submitted: 'info',
      Screened: 'info',
      Shortlisted: 'warn',
      InterviewScheduled: 'warn',
      InterviewCompleted: 'info',
      OfferExtended: 'success',
      OfferAccepted: 'success',
      Hired: 'success',
      Rejected: 'danger',
      Withdrawn: 'secondary',
      OfferDeclined: 'secondary',
    };
    return map[status] ?? 'info';
  }

  statusLabel(status: string): string {
    return status.replace(/([A-Z])/g, ' $1').trim();
  }
}