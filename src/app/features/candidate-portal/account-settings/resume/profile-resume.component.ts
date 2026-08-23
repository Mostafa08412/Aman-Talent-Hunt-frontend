import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CandidateProfileService } from '@core/services/candidate-profile.service';
import { CandidateResumeService } from '@core/services/candidate-resume.service';

interface ResumeFile {
  name: string;
}

interface CandidateSnapshot {
  name: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-profile-resume',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, FileUploadModule, ToastModule],
  providers: [MessageService],
  templateUrl: './profile-resume.component.html',
  styleUrl: './profile-resume.component.scss',
})
export class ProfileResumeComponent implements OnInit {
  private message = inject(MessageService);
  private profileService = inject(CandidateProfileService);
  private resumeService = inject(CandidateResumeService);
  private sanitizer = inject(DomSanitizer);

  isLoading = signal(true);
  isUploading = signal(false);
  isPreviewLoading = signal(false);

  candidate = signal<CandidateSnapshot | null>(null);
  currentResume = signal<ResumeFile | null>(null);

  previewVisible = signal(false);
  previewUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.profileService.getProfile().subscribe({
      next: (result) => {
        const profile = result.data;
        if (profile) {
          this.candidate.set({
            name: `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Your profile',
            email: profile.email ?? '',
            phone: profile.phoneNumber ?? '',
          });
          this.currentResume.set(
            profile.resumeFileName ? { name: profile.resumeFileName } : null,
          );
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Could not load your profile',
          detail: 'Please try again in a moment.',
        });
      },
    });
  }

  onUpload(event: { files: File[] }): void {
    const file = event.files[0];
    if (!file) return;
    this.isUploading.set(true);
    this.resumeService.upload(file).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.currentResume.set({ name: file.name });
        this.message.add({
          severity: 'success',
          summary: 'Uploaded',
          detail: `${file.name} has been added to your profile.`,
        });
      },
      error: () => {
        this.isUploading.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Upload failed',
          detail: 'Please try again.',
        });
      },
    });
  }

  openPreview(): void {
    this.previewVisible.set(true);
    if (this.previewUrl()) return;
    this.isPreviewLoading.set(true);
    this.resumeService.download(true).subscribe({
      next: (blob) => {
        this.isPreviewLoading.set(false);
        const url = URL.createObjectURL(blob.slice(0, blob.size, 'application/pdf'));
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      },
      error: () => {
        this.isPreviewLoading.set(false);
        this.message.add({ severity: 'error', summary: 'Preview failed', detail: 'Could not load your resume.' });
      },
    });
  }

  download(): void {
    this.resumeService.download().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.currentResume()?.name ?? 'resume.pdf';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.message.add({ severity: 'error', summary: 'Download failed', detail: 'Please try again.' });
      },
    });
  }
}
