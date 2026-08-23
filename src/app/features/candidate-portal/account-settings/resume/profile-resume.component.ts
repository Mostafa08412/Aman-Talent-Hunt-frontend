import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface ResumeFile {
  name: string;
  size: number;
  updated: string;
}

@Component({
  selector: 'app-profile-resume',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, FileUploadModule, ToastModule],
  providers: [MessageService],
  templateUrl: './profile-resume.component.html',
  styleUrl: './profile-resume.component.scss',
})
export class ProfileResumeComponent {
  private message = inject(MessageService);

  candidate = {
    name: 'Alex Mercer',
    email: 'alex.mercer@email.com',
    phone: '+20 100 123 4567',
  };

  currentResume = signal<ResumeFile>({
    name: 'Alex_Mercer_Resume_2026.pdf',
    size: 245760,
    updated: 'Updated Jan 15, 2026',
  });

  previewVisible = signal(false);
  uploadedName = signal<string | null>(null);

  formattedSize(bytes: number): string {
    return (bytes / 1024).toFixed(0) + ' KB';
  }

  onUpload(event: { files: File[] }): void {
    const file = event.files[0];
    if (!file) return;
    this.uploadedName.set(file.name);
    this.message.add({
      severity: 'success',
      summary: 'Uploaded',
      detail: `${file.name} has been added to your profile.`,
    });
  }

  openPreview(): void {
    this.previewVisible.set(true);
  }

  download(): void {
    this.message.add({
      severity: 'info',
      summary: 'Download',
      detail: 'Your resume is being prepared for download.',

    });
  }
}
