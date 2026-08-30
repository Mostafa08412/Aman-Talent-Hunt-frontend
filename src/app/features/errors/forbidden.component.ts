import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <div class="error-page">
      <div class="error-card">
        <span class="error-code">403</span>
        <i class="pi pi-lock error-icon"></i>
        <h1>Access denied</h1>
        @if (auth.currentUser(); as user) {
        <p class="who">Signed in as <strong>{{ user.fullName }}</strong> ({{ auth.role() }})</p>
        }
        <p>You don't have permission to view this page. If you believe this is a mistake,
          contact your administrator.</p>
        <div class="error-actions">
          <a routerLink="/console" pButton type="button" label="Back to Dashboard"
            icon="pi pi-arrow-left"></a>
          <a routerLink="/" pButton type="button" label="Go to Home" severity="secondary"
            [outlined]="true"></a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .error-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 75vh;
        padding: 3rem 1.5rem;
      }
      .error-card {
        max-width: 30rem;
        text-align: center;
      }
      .error-code {
        display: block;
        font-size: 5.5rem;
        font-weight: 800;
        line-height: 1;
        color: var(--aman-orange);
        background: linear-gradient(135deg, var(--ath-accent), var(--aman-orange));
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .error-icon {
        display: block;
        margin: 1.25rem auto 1.5rem;
        font-size: 2.25rem;
        color: var(--ath-accent);
      }
      h1 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
      }
      p {
        color: var(--p-surface-600);
        margin-bottom: 1.75rem;
      }
      .who {
        font-size: 0.8125rem;
        color: var(--p-surface-500);
        margin-bottom: 0.75rem;
      }
      .error-actions {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class ForbiddenComponent {
  auth = inject(AuthService);
}