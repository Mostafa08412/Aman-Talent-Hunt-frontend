import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RequisitionService, RequisitionDetail } from '../../../core/services/requisition.service';
import { InterviewService, ScoredCandidate } from '../../../core/services/interview.service';

@Component({
  selector: 'app-finalist-selection',
  standalone: true,
  imports: [FormsModule, CardModule, ButtonModule, TableModule, RadioButtonModule, MessageModule, ProgressSpinnerModule],
  templateUrl: './finalist-selection.component.html',
  styleUrl: './finalist-selection.component.scss',
})
export class FinalistSelectionComponent {
  private requisitionService = inject(RequisitionService);
  private interviewService = inject(InterviewService);

  // Bound automatically from the `:id` route param via withComponentInputBinding().
  id = input<string>();

  loading = signal(true);
  loadError = signal<string | null>(null);
  requisition = signal<RequisitionDetail | null>(null);
  candidates = signal<ScoredCandidate[]>([]);

  selectedCandidateId = signal<string | null>(null);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  submitted = signal(false);

  canSubmit = computed(() => !!this.selectedCandidateId());

  constructor() {
    const id = this.id();
    if (!id) {
      this.loadError.set('No requisition specified.');
      this.loading.set(false);
      return;
    }
    this.requisitionService.getById(id).subscribe((req) => this.requisition.set(req ?? null));
    this.interviewService.getScoredCandidates(id).subscribe({
      next: (candidates) => {
        this.candidates.set(candidates);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load scored candidates right now. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    const id = this.id();
    const candidateId = this.selectedCandidateId();
    if (!id || !candidateId || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.interviewService.selectFinalist(id, candidateId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set('Unable to submit this selection right now. Please try again later.');
      },
    });
  }
}
