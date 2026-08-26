import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';

import { AdminApplicationsService } from '@core/services/admin-applications.service';
import {
  ApplicantDetailDto,
  ApplicationStatus,
} from '@core/models';
import { StatusBadgeComponent, humanizeEnum } from './status-badge.component';
import { RelativeTimePipe } from './relative-time.pipe';

/** Interview timeline row shown inside the drawer. */
export interface ApplicantInterviewRow {
  id: string;
  roundName: string | null;
  roundNumber: number;
  interviewerName: string | null;
  scheduledDate: string | null;
  status: string;
  result: string;
  comment: string | null;
}

@Component({
  selector: 'app-applicant-detail-drawer',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ButtonModule,
    DrawerModule,
    MenuModule,
    StatusBadgeComponent,
    RelativeTimePipe,
  ],
  templateUrl: './applicant-detail-drawer.component.html',
  styleUrl: './applicant-detail-drawer.component.scss',
})
export class ApplicantDetailDrawerComponent {
  private readonly applicationsService = inject(AdminApplicationsService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly visible = signal(false);
  readonly visibleChange = output<boolean>();

  /** Parent supplies stage-action buttons through this template (context-aware actions). */
  readonly actionsTemplate = input<import('@angular/core').TemplateRef<unknown> | null>(null);

  readonly detail = signal<ApplicantDetailDto | null>(null);
  readonly interviews = signal<ApplicantInterviewRow[]>([]);
  readonly loading = signal(false);
  readonly downloadingCv = signal(false);
  readonly previewVisible = signal(false);
  readonly previewUrl = signal<SafeResourceUrl | null>(null);
  readonly previewLoading = signal(false);

  open(applicationId: string): void {
    this.visible.set(true);
    this.visibleChange.emit(true);
    this.detail.set(null);
    this.interviews.set([]);
    this.loading.set(true);
    this.previewVisible.set(false);
    this.previewUrl.set(null);

    this.applicationsService.getById(applicationId).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.detail.set(res.data ?? null);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  close(): void {
    this.visible.set(false);
    this.visibleChange.emit(false);
  }

  onVisibleChange(v: boolean): void {
    this.visible.set(v);
    this.visibleChange.emit(v);
  }

  fullName(): string {
    const d = this.detail();
    if (!d) return '';
    return [d.candidateFirstName, d.candidateLastName].filter(Boolean).join(' ').trim() || 'Unnamed candidate';
  }

  readonly answers = computed(() => this.detail()?.answers ?? []);
  readonly hasAnswers = computed(() => (this.detail()?.answers?.length ?? 0) > 0);

  initials(): string {
    return this.fullName()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  resumeFileName(): string | null {
    return this.detail()?.resumeFileName ?? null;
  }

  applicationId(): string | null {
    return this.detail()?.id ?? null;
  }

  previewCv(): void {
    const id = this.applicationId();
    if (!id) return;

    this.previewVisible.set(true);
    this.previewLoading.set(true);
    this.applicationsService.downloadResume(id, true).subscribe({
      next: (blob) => {
        this.previewLoading.set(false);
        if (!blob) return;
        const unsafe = URL.createObjectURL(blob);
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(unsafe));
      },
      error: () => {
        this.previewLoading.set(false);
      },
    });
  }

  closePreview(): void {
    this.previewVisible.set(false);
  }

  downloadCv(): void {
    const id = this.applicationId();
    if (!id) return;

    this.downloadingCv.set(true);
    this.applicationsService.downloadResume(id).subscribe({
      next: (blob) => {
        this.downloadingCv.set(false);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.resumeFileName() ?? `resume-${id.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloadingCv.set(false);
      },
    });
  }

  protected readonly humanize = humanizeEnum;
}
