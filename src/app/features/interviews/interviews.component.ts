import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MenuModule } from 'primeng/menu';

import { InterviewService } from '@core/services/interview.service';
import { InterviewListItemDto } from '@core/models/interview-model';
import { InterviewFormat, InterviewStatus } from '@core/models/enums';

import { StatusBadgeComponent, humanizeEnum } from '../job-postings/shared/status-badge.component';

interface EnumOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-interviews',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MenuModule,
    StatusBadgeComponent,
  ],
  templateUrl: './interviews.component.html',
  styleUrl: './interviews.component.scss',
})
export class InterviewsComponent {
  private readonly interviewService = inject(InterviewService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly interviews = signal<InterviewListItemDto[]>([]);
  readonly isLoading = signal(false);

  readonly filterForm = this.fb.group({
    search: [''],
    status: this.fb.control<InterviewStatus | null>(null),
    format: this.fb.control<InterviewFormat | null>(null),
  });

  readonly statusOptions: EnumOption[] = Object.values(InterviewStatus).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));
  readonly formatOptions: EnumOption[] = Object.values(InterviewFormat).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));

  // ── Row menu ──
  actionMenuItems = signal<{ label: string; icon?: string; disabled?: boolean; command?: () => void }[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    const v = this.filterForm.getRawValue();

    this.interviewService.getMy().subscribe({
      next: (res) => {
        let items = res.data ?? [];
        if (v.search?.trim()) {
          const q = v.search.trim().toLowerCase();
          items = items.filter(
            (i) =>
              [i.candidateFirstName, i.candidateLastName, i.interviewerName, i.roundName]
                .filter(Boolean)
                .some((f) => f!.toLowerCase().includes(q)),
          );
        }
        if (v.status) items = items.filter((i) => i.status === v.status);
        if (v.format) items = items.filter((i) => i.formatSnapshot === v.format);
        this.interviews.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.interviews.set([]);
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.load();
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', status: null, format: null });
    this.load();
  }

  candidateName(row: InterviewListItemDto): string {
    return [row.candidateFirstName, row.candidateLastName].filter(Boolean).join(' ').trim() || 'Unknown';
  }

  roundLabel(row: InterviewListItemDto): string {
    return row.roundName ?? `Round ${row.roundNumber}`;
  }

  openDetail(row: InterviewListItemDto): void {
    this.router.navigate(['/console/interviews', row.id]);
  }

  openRowMenu(row: InterviewListItemDto, event: Event, menu: any): void {
    const items: { label: string; icon?: string; disabled?: boolean; command?: () => void }[] = [];

    items.push({
      label: 'View Details',
      icon: 'pi pi-info-circle',
      command: () => this.openDetail(row),
    });

    if (row.status === InterviewStatus.Scheduled || row.status === InterviewStatus.Rescheduled) {
      items.push({
        label: 'Submit Result…',
        icon: 'pi pi-check-square',
        command: () => this.openDetail(row),
      });
    }

    this.actionMenuItems.set(items);
    menu.toggle(event);
  }

  protected readonly enumLabel = humanizeEnum;
}
