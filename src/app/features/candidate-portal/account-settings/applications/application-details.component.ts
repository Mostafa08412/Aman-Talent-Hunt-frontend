import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CandidateApplicationsService } from '@core/services/candidate-applications.service';
import { CandidateApplicationDetailDto } from '@core/models/application-model';

export interface TimelineEvent {
  title: string;
  date: string;
  note?: string;
  done: boolean;
  current: boolean;
}

export interface InterviewDisplay {
  round: string;
  date: string;
  format: string;
  status: string;
  location: string;
}

export interface AppDetail {
  id: string;
  title: string;
  source: string;
  status: string;
  appliedAt: string;
  timeline: TimelineEvent[];
  interviews: InterviewDisplay[];
}

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

const TERMINAL_STATUSES = new Set(['Rejected', 'Withdrawn', 'OfferDeclined', 'Hired', 'OfferAccepted']);

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [CommonModule, RouterModule, TagModule, ButtonModule, TimelineModule, ToastModule],
  providers: [MessageService],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.scss',
})
export class ApplicationDetailsComponent implements OnInit {
  private applicationsService = inject(CandidateApplicationsService);
  private message = inject(MessageService);

  readonly id = input<string>('');

  isLoading = signal(true);
  raw = signal<CandidateApplicationDetailDto | null>(null);

  detail = computed<AppDetail | null>(() => {
    const dto = this.raw();
    return dto ? this.toDetail(dto) : null;
  });

  ngOnInit(): void {
    this.load(this.id());
  }

  private load(id: string): void {
    if (!id) return;
    this.isLoading.set(true);
    this.applicationsService.getMyApplicationById(id).subscribe({
      next: (result) => {
        this.raw.set(result.data ?? null);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Could not load this application',
          detail: 'Please try again in a moment.',
        });
      },
    });
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

  canWithdraw(status: string): boolean {
    return status === 'Submitted' || status === 'Screened' || status === 'Shortlisted';
  }

  withdraw(): void {
    this.message.add({ severity: 'info', summary: 'Withdraw', detail: 'Withdrawal is not available yet.' });
  }

  private formatDate(value?: string | null): string {
    if (!value) return 'Pending';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private toDetail(dto: CandidateApplicationDetailDto): AppDetail {
    const events = dto.timeline ?? [];
    const timeline: TimelineEvent[] = events.map((event, index) => ({
      title: this.statusLabel(event.status),
      date: this.formatDate(event.atUTC),
      note: event.note ?? undefined,
      done: !TERMINAL_STATUSES.has(dto.status) ? true : index < events.length - 1,
      current: index === events.length - 1,
    }));

    const interviews: InterviewDisplay[] = (dto.interviews ?? []).map((interview) => ({
      round: interview.roundName ?? 'Interview',
      date: interview.scheduledDate ? this.formatDate(interview.scheduledDate) : 'TBD',
      format: interview.format,
      status: interview.status,
      location: interview.locationDetails ?? interview.meetingLink ?? 'TBD',
    }));

    return {
      id: dto.id,
      title: dto.jobPostTitle ?? 'Untitled role',
      source: dto.source,
      status: dto.status,
      appliedAt: this.formatDate(dto.createdAtUTC),
      timeline,
      interviews,
    };
  }
}