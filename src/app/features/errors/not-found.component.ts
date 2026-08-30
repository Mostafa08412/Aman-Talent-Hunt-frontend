import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <div class="error-page">
      <div class="error-card">
        <span class="error-code">404</span>
        <i class="pi pi-compass error-icon"></i>
        <h1>Page not found</h1>
        <p>The page you are looking for may have been removed, renamed, or is temporarily
          unavailable.</p>
        <a routerLink="/" pButton type="button" label="Back to Home" icon="pi pi-home"></a>
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
    `,
  ],
})
export class NotFoundComponent {}