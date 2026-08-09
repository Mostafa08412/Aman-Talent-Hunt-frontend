import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-job-board',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Open Positions</h1>
      </div>
      <p-card>
        <div class="stub-body">
          <i class="pi pi-briefcase"></i>
          <p>Job listing grid — search by title, department, location, employment type (FR06a).</p>
        </div>
      </p-card>
    </div>
  `,
  styles: [
    `
      .stub-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 2.5rem 1rem;
        color: var(--p-surface-400);
      }
      .stub-body i {
        font-size: 2rem;
      }
    `,
  ],
})
export class JobBoardComponent {}
