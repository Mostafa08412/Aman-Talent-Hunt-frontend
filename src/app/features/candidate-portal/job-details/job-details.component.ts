import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    TagModule,
    TextareaModule,
    SelectModule,
    FileUploadModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './job-details.component.html',
  styleUrl: './job-details.component.scss',
})
export class JobDetailsComponent {
  private fb = inject(FormBuilder);
  private message = inject(MessageService);

  job = {
    title: 'Senior Product Manager - Payments',
    category: 'Product Management',
    tags: [
      { label: 'Full Time', value: 'full-time' },
      { label: 'Cairo, Egypt (Hybrid)', value: 'hybrid' },
    ],
    level: 'Mid-Senior Level',
    posted: 'Posted 2 days ago',
  };

  description = [
    'AMAN is seeking a highly motivated Senior Product Manager to lead our digital payments portfolio. You will be responsible for defining the product vision, strategy, and roadmap for our core payment experiences, ensuring we deliver seamless, secure, and innovative solutions to millions of users across Egypt.',
    'In this role, you will work at the intersection of business, design, and engineering, driving initiatives from conceptualization to launch and beyond. You must possess a strong understanding of the fintech landscape, exceptional analytical skills, and a proven track record of shipping successful consumer-facing products.',
  ];

  responsibilities = [
    'Define and execute the product strategy for AMAN\'s digital payments vertical, aligning with overall business objectives.',
    'Conduct deep market research, competitive analysis, and user interviews to identify unmet needs and emerging trends.',
    'Translate strategic vision into actionable user stories, detailed requirements, and clear acceptance criteria.',
    'Collaborate closely with engineering, design, data, and compliance teams to ensure timely and high-quality delivery.',
    'Define, track, and analyze key performance metrics (KPIs) to measure product success and iterate rapidly based on data.',
    'Manage stakeholder expectations and communicate product updates effectively across the organization.',
  ];

  qualifications = [
    '5+ years of product management experience, with at least 2 years in fintech, payments, or digital banking.',
    'Strong technical acumen and ability to engage in architectural discussions with engineering teams.',
    'Demonstrated success in launching complex, consumer-facing mobile products.',
    'Exceptional analytical and problem-solving skills; proficiency in data analysis tools (e.g., Mixpanel, SQL).',
    'Excellent written and verbal communication skills; ability to articulate complex concepts simply.',
    'Bachelor\'s degree in Computer Science, Business, or a related field (MBA is a plus).',
  ];

  currentResume = { name: 'Alex_Mercer_CV_2026.pdf', meta: 'Updated Jan 15, 2026' };
  uploadVisible = signal(false);
  showUpload = signal(false);
  isSubmitting = signal(false);
  successVisible = signal(false);

  sourceOptions = [
    { label: 'LinkedIn', value: 'linkedin' },
    { label: 'Referral', value: 'referral' },
    { label: 'Job Board', value: 'job-board' },
    { label: 'Company Website', value: 'website' },
    { label: 'Other', value: 'other' },
  ];

  form = this.fb.nonNullable.group({
    question: ['', Validators.required],
    source: ['', Validators.required],
  });

  onResumeSelected(event: { files: File[] }): void {
    const file = event.files[0];
    if (!file) return;
    this.currentResume.name = file.name;
    this.message.add({
      severity: 'success',
      summary: 'Resume uploaded',
      detail: `${file.name} will be used for this application.`,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please complete all required fields.' });
      return;
    }
    this.isSubmitting.set(true);
    // Dummy submit — replace with applications service call.
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.successVisible.set(true);
    }, 1200);
  }
}