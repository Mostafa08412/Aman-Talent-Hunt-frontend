import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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
  department: string;
  location: string;
  source: string;
  status: string;
  appliedAt: string;
  timeline: TimelineEvent[];
  interviews: InterviewDisplay[];
}

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [CommonModule, RouterModule, TagModule, ButtonModule, TimelineModule, ToastModule],
  providers: [MessageService],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.scss',
})
export class ApplicationDetailsComponent {
  private message = inject(MessageService);

  readonly id = input<string>('');

  detail = computed(() => this.buildDetail(this.id()));

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

  withdraw(): void {
    this.message.add({ severity: 'info', summary: 'Withdraw', detail: 'Withdrawal is not available in this demo.' });
  }

  private buildDetail(id: string): AppDetail {
    const rows: Record<string, Omit<AppDetail, 'timeline' | 'interviews'>> = {
      'app-pm-payments': { id, title: 'Senior Product Manager - Payments', department: 'Product Management', location: 'Cairo', source: 'LinkedIn', status: 'InterviewScheduled', appliedAt: 'Feb 10, 2026' },
      'app-fe-angular': { id, title: 'Frontend Engineer (Angular)', department: 'Engineering & IT', location: 'Cairo', source: 'Portal', status: 'Screened', appliedAt: 'Jan 22, 2026' },
      'app-flutter-dev': { id, title: 'Mobile Developer (Flutter)', department: 'Engineering & IT', location: 'Remote', source: 'LinkedIn', status: 'Shortlisted', appliedAt: 'Jan 30, 2026' },
      'app-payments-spec': { id, title: 'Digital Payments Specialist', department: 'Digital Payments', location: 'Cairo', source: 'Portal', status: 'Submitted', appliedAt: 'Feb 10, 2026' },
      'app-data-analyst': { id, title: 'Data Analyst', department: 'Engineering & IT', location: 'Cairo', source: 'Wuzzuf', status: 'OfferExtended', appliedAt: 'Nov 5, 2025' },
      'app-risk-analyst': { id, title: 'Credit Risk Analyst', department: 'Consumer Finance', location: 'Cairo', source: 'Wuzzuf', status: 'Rejected', appliedAt: 'Dec 10, 2025' },
    };

    const base = rows[id] ?? rows['app-pm-payments'];
    return { ...base, timeline: this.timelineFor(base.status), interviews: this.interviewsFor(base.status) };
  }

  private timelineFor(status: string): TimelineEvent[] {
    const applied: TimelineEvent = { title: 'Application Submitted', date: 'Feb 10, 2026', note: 'Resume received and logged in the ATS.', done: true, current: false };
    const screened: TimelineEvent = { title: 'Application Screened', date: 'Feb 16, 2026', note: 'Screening completed by the talent team.', done: true, current: false };
    const shortlisted: TimelineEvent = { title: 'Shortlisted', date: 'Feb 20, 2026', done: true, current: false };
    const interview: TimelineEvent = { title: 'Interview Scheduled', date: 'Mar 2, 2026', note: 'HR interview via video call.', done: false, current: true };
    const offer: TimelineEvent = { title: 'Offer', date: 'Pending', done: false, current: false };
    const hired: TimelineEvent = { title: 'Onboarding', date: 'Pending', done: false, current: false };

    switch (status) {
      case 'Submitted':
        return [applied];
      case 'Screened':
        return [applied, screened];
      case 'Shortlisted':
        return [applied, screened, shortlisted];
      case 'InterviewScheduled':
        return [applied, screened, shortlisted, interview];
      case 'OfferExtended':
        return [applied, screened, shortlisted, { ...interview, done: true, current: false }, { ...offer, done: true, current: true }];
      case 'Rejected':
        return [applied, screened, { title: 'Not Selected', date: 'Dec 18, 2025', note: 'We appreciate your interest and encourage you to apply again.', done: false, current: true }];
      default:
        return [applied];
    }
  }

  private interviewsFor(status: string): InterviewDisplay[] {
    if (status !== 'InterviewScheduled') {
      return [];
    }
    return [
      {
        round: 'HR Interview',
        date: 'Mar 2, 2026 · 11:00 AM',
        format: 'Video Call',
        status: 'Scheduled',
        location: 'Microsoft Teams',
      },
      {
        round: 'Technical Interview',
        date: 'TBD',
        format: 'Panel',
        status: 'Scheduled',
        location: 'AMAN HQ, New Cairo',
      },
    ];
  }
}