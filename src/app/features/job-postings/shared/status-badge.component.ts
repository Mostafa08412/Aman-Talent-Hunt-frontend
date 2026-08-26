import { Component, computed, input } from '@angular/core';
import {
  ApplicationStatus,
  InterviewResult,
  InterviewStatus,
  JobPostStatus,
  PostingVisibility,
} from '@core/models/enums';

export type BadgeKind = 'jobPost' | 'application' | 'interviewStatus' | 'interviewResult' | 'visibility';

interface BadgeStyle {
  cls: string;
}

const JOB_POST_BADGES: Record<JobPostStatus, BadgeStyle> = {
  [JobPostStatus.Draft]: { cls: 'badge-gray' },
  [JobPostStatus.Published]: { cls: 'badge-green' },
  [JobPostStatus.Closed]: { cls: 'badge-slate' },
  [JobPostStatus.Filled]: { cls: 'badge-blue' },
  [JobPostStatus.OnHold]: { cls: 'badge-amber' },
};

const APPLICATION_BADGES: Record<ApplicationStatus, BadgeStyle> = {
  [ApplicationStatus.Submitted]: { cls: 'badge-gray' },
  [ApplicationStatus.Screened]: { cls: 'badge-sky' },
  [ApplicationStatus.Shortlisted]: { cls: 'badge-violet' },
  [ApplicationStatus.InterviewScheduled]: { cls: 'badge-blue' },
  [ApplicationStatus.InterviewCompleted]: { cls: 'badge-indigo' },
  [ApplicationStatus.OfferExtended]: { cls: 'badge-teal' },
  [ApplicationStatus.OfferAccepted]: { cls: 'badge-green' },
  [ApplicationStatus.Hired]: { cls: 'badge-green-strong' },
  [ApplicationStatus.Rejected]: { cls: 'badge-red' },
  [ApplicationStatus.Withdrawn]: { cls: 'badge-slate' },
  [ApplicationStatus.OfferDeclined]: { cls: 'badge-red' },
};

const INTERVIEW_STATUS_BADGES: Record<InterviewStatus, BadgeStyle> = {
  [InterviewStatus.Scheduled]: { cls: 'badge-blue' },
  [InterviewStatus.Completed]: { cls: 'badge-green' },
  [InterviewStatus.Cancelled]: { cls: 'badge-red' },
  [InterviewStatus.Rescheduled]: { cls: 'badge-amber' },
};

const INTERVIEW_RESULT_BADGES: Record<InterviewResult, BadgeStyle> = {
  [InterviewResult.PendingFeedback]: { cls: 'badge-gray' },
  [InterviewResult.Passed]: { cls: 'badge-green' },
  [InterviewResult.Failed]: { cls: 'badge-red' },
};

const VISIBILITY_BADGES: Record<PostingVisibility, BadgeStyle> = {
  [PostingVisibility.Public]: { cls: 'badge-teal' },
  [PostingVisibility.InternalOnly]: { cls: 'badge-amber' },
};

/** Human-readable labels for string enums (split camel case). */
export function humanizeEnum(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly value = input.required<string>();
  readonly kind = input<BadgeKind>('application');

  readonly label = computed(() => humanizeEnum(this.value()));

  readonly styleClass = computed(() => {
    const v = this.value();
    switch (this.kind()) {
      case 'jobPost':
        return JOB_POST_BADGES[v as JobPostStatus]?.cls ?? 'badge-gray';
      case 'interviewStatus':
        return INTERVIEW_STATUS_BADGES[v as InterviewStatus]?.cls ?? 'badge-gray';
      case 'interviewResult':
        return INTERVIEW_RESULT_BADGES[v as InterviewResult]?.cls ?? 'badge-gray';
      case 'visibility':
        return VISIBILITY_BADGES[v as PostingVisibility]?.cls ?? 'badge-gray';
      default:
        return APPLICATION_BADGES[v as ApplicationStatus]?.cls ?? 'badge-gray';
    }
  });
}
