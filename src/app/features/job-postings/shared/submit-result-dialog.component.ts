import { Component, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextarea } from 'primeng/inputtextarea';

import { InterviewService } from '@core/services/interview.service';
import { InterviewResult } from '@core/models';

export interface SubmitResultContext {
  interviewId: string;
  applicantId: string;
  candidateName: string;
  roundName: string;
  roundNumber: number;
}

/** What the parent should offer after a verdict is recorded (guide §5.7). */
export type NextMoveSuggestion =
  | 'scheduleNextRound'
  | 'moveToInterviewCompleted'
  | 'rejectApplicant'
  | null;

@Component({
  selector: 'app-submit-result-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    SelectButtonModule,
    InputTextarea,
  ],
  templateUrl: './submit-result-dialog.component.html',
  styleUrl: './submit-result-dialog.component.scss',
})
export class SubmitResultDialogComponent {
  private readonly interviewService = inject(InterviewService);
  private readonly fb = inject(FormBuilder);

  /** `hasMoreRounds`: whether round N+1 exists on the post's setup. */
  readonly context = input<SubmitResultContext | null>(null);
  readonly hasMoreRounds = input(false);

  readonly visible = signal(false);
  readonly visibleChange = output<boolean>();
  /** Emits after `PATCH /api/interviews/{id}/result` succeeds, with the suggested next move. */
  readonly resultSaved = output<{
    applicantId: string;
    result: InterviewResult;
    suggestion: NextMoveSuggestion;
  }>();

  readonly submitting = signal(false);

  readonly form = this.fb.group({
    decision: this.fb.nonNullable.control<InterviewResult>(InterviewResult.Passed),
    comment: this.fb.nonNullable.control<string>('', Validators.required),
  });

  readonly decisionOptions = [
    { label: 'Passed', value: InterviewResult.Passed },
    { label: 'Failed', value: InterviewResult.Failed },
  ];

  open(): void {
    this.form.reset({ decision: InterviewResult.Passed, comment: '' });
    this.visible.set(true);
    this.visibleChange.emit(true);
  }

  close(): void {
    this.visible.set(false);
    this.visibleChange.emit(false);
  }

  cancel(): void {
    this.close();
  }

  submit(): void {
    const ctx = this.context();
    if (!ctx || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    this.submitting.set(true);
    this.interviewService.submitResult(ctx.interviewId, {
      result: v.decision,
      comment: v.comment.trim(),
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (!res.isCompletedSuccessfully) return;

        const suggestion: NextMoveSuggestion =
          v.decision === InterviewResult.Passed
            ? this.hasMoreRounds()
              ? 'scheduleNextRound'
              : 'moveToInterviewCompleted'
            : 'rejectApplicant';

        this.resultSaved.emit({ applicantId: ctx.applicantId, result: v.decision, suggestion });
        this.close();
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }
}
