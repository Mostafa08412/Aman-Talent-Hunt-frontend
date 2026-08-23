import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CandidateApplicationsService } from '@core/services/candidate-applications.service';
import { CandidateApplicationsDTO } from '@core/models/application-model';

export interface ApplicationRow {
  id: string;
  jobPostTitle: string;
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
  providers: [MessageService],
  templateUrl: './application-history.component.html',
  styleUrl: './application-history.component.scss',
})
export class ApplicationHistoryComponent implements OnInit {
  private applicationsService = inject(CandidateApplicationsService);
  private message = inject(MessageService);

  isLoading = signal(true);
  applications = signal<ApplicationRow[]>([]);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.applicationsService.getMyApplications().subscribe({
      next: (result) => {
        const rows = (result.data ?? []).map((dto) => this.toRow(dto));
        this.applications.set(rows);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Could not load applications',
          detail: 'Please try again in a moment.',
        });
      },
    });
  }

  private toRow(dto: CandidateApplicationsDTO): ApplicationRow {
    return {
      id: dto.id,
      jobPostTitle: dto.jobPostTitle ?? 'Untitled role',
      source: dto.source,
      status: dto.status,
      appliedAt: this.formatDate(dto.createdAtUTC),
      upcomingInterview: dto.upcomingInterview?.scheduledDate
        ? this.formatDate(dto.upcomingInterview.scheduledDate)
        : undefined,
    };
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

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