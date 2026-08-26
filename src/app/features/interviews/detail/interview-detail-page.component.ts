import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

import { InterviewService, ScorecardDecision } from '@core/services/interview.service';
import { InterviewDetailDto } from '@core/models/interview-model';
import { InterviewStatus } from '@core/models/enums';

import { StatusBadgeComponent } from '../../job-postings/shared/status-badge.component';

@Component({
  selector: 'app-interview-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    RadioButtonModule,
    TextareaModule,
    MessageModule,
    ProgressSpinnerModule,
    TooltipModule,
    StatusBadgeComponent,
  ],
  templateUrl: './interview-detail-page.component.html',
  styleUrl: './interview-detail-page.component.scss',
})
export class InterviewDetailPageComponent implements OnInit {
  private readonly interviewService = inject(InterviewService);
  private readonly router = inject(Router);

  id = input<string>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly detail = signal<InterviewDetailDto | null>(null);

  // ── Scorecard state ──
  readonly ScorecardDecision = ScorecardDecision;
  readonly decision = signal<ScorecardDecision | null>(null);
  readonly feedback = signal('');
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly canSubmit = computed(() => !!this.decision() && this.feedback().trim().length > 0);

  readonly canShowScorecard = computed(() => {
    const d = this.detail();
    return d && (d.status === InterviewStatus.Scheduled || d.status === InterviewStatus.Rescheduled);
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      this.error.set('No interview specified.');
      this.loading.set(false);
      return;
    }
    this.interviewService.getById(id).subscribe({
      next: (res) => {
        if (!res.data) {
          this.error.set('Interview not found.');
        } else {
          this.detail.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load interview details.');
        this.loading.set(false);
      },
    });
  }

  candidateName(d: InterviewDetailDto): string {
    return [d.candidateFirstName, d.candidateLastName].filter(Boolean).join(' ').trim() || 'Unknown';
  }

  roundLabel(d: InterviewDetailDto): string {
    return d.roundName ?? `Round ${d.roundNumber}`;
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString([], {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  copyToClipboard(text: string | null): void {
    if (!text) return;
    navigator.clipboard.writeText(text);
  }

  back(): void {
    this.router.navigate(['/console/interviews']);
  }

  submitScorecard(): void {
    const d = this.detail();
    if (!d || !this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);

    this.interviewService
      .submitScorecard({
        interviewId: d.id,
        decision: this.decision()!,
        feedback: this.feedback().trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
          // Refresh detail to show updated status/result
          this.interviewService.getById(d.id).subscribe({
            next: (res) => {
              if (res.data) this.detail.set(res.data);
            },
          });
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set('Unable to submit scorecard. Please try again.');
        },
      });
  }
}
