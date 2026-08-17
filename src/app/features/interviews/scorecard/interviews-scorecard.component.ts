import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  InterviewService,
  InterviewScorecardContext,
  ScorecardDecision,
} from '../../../core/services/interview.service';

@Component({
  selector: 'app-interviews-scorecard',
  standalone: true,
  imports: [FormsModule, CardModule, ButtonModule, RadioButtonModule, TextareaModule, MessageModule, ProgressSpinnerModule],
  templateUrl: './interviews-scorecard.component.html',
  styleUrl: './interviews-scorecard.component.scss',
})
export class InterviewsScorecardComponent {
  private interviewService = inject(InterviewService);
  private router = inject(Router);

  // Bound automatically from the `:id` route param via withComponentInputBinding().
  id = input<string>();

  ScorecardDecision = ScorecardDecision;

  loading = signal(true);
  loadError = signal<string | null>(null);
  context = signal<InterviewScorecardContext | null>(null);

  decision = signal<ScorecardDecision | null>(null);
  feedback = signal('');

  submitting = signal(false);
  submitError = signal<string | null>(null);
  submitted = signal(false);

  canSubmit = computed(() => !!this.decision() && this.feedback().trim().length > 0);

  constructor() {
    const id = this.id();
    if (!id) {
      this.loadError.set('No interview specified.');
      this.loading.set(false);
      return;
    }
    this.interviewService.getScorecardContext(id).subscribe({
      next: (ctx) => {
        if (!ctx) {
          this.loadError.set('Interview not found.');
        } else {
          this.context.set(ctx);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load this interview right now. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    const ctx = this.context();
    if (!ctx || !this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.interviewService
      .submitScorecard({
        interviewId: ctx.interviewId,
        decision: this.decision()!,
        feedback: this.feedback().trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set('Unable to submit this scorecard right now. Please try again later.');
        },
      });
  }

  backToInterviews(): void {
    this.router.navigate(['/console/interviews']);
  }
}
