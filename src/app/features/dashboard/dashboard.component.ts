import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Welcome back, {{ auth.currentUser()?.fullName }}</h1>
      </div>

      <div class="stat-grid">
        <p-card styleClass="stat-card">
          <span class="stat-label">Open Requisitions</span>
          <span class="stat-value">—</span>
        </p-card>
        <p-card styleClass="stat-card">
          <span class="stat-label">Active Candidates</span>
          <span class="stat-value">—</span>
        </p-card>
        <p-card styleClass="stat-card">
          <span class="stat-label">Interviews This Week</span>
          <span class="stat-value">—</span>
        </p-card>
        <p-card styleClass="stat-card">
          <span class="stat-label">Offers Pending</span>
          <span class="stat-value">—</span>
        </p-card>
      </div>

      <p class="hint">
        Role-specific widgets go here — swap this grid per {{ auth.role() }} once the reporting API
        (FR40, TA Performance Dashboard) is available.
      </p>
    </div>
  `,
  styles: [
    `
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
      .stat-label {
        display: block;
        font-size: 0.8rem;
        color: var(--p-surface-500);
        margin-block-end: 0.375rem;
      }
      .stat-value {
        display: block;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--p-primary-700);
      }
      .hint {
        font-size: 0.8125rem;
        color: var(--p-surface-400);
      }
    `,
  ],
})
export class DashboardComponent {
  auth = inject(AuthService);
}
