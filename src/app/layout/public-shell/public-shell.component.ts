import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="public-header">
      <a routerLink="/" class="brand">
        <img src="/assets/logo.svg" alt="Aman" />
        <span>Aman Talent Hunt</span>
      </a>
      <a routerLink="/login" class="sign-in">Sign In</a>
    </header>
    <main class="public-content">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      .public-header {
        height: var(--ath-header-height);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-inline: 1.5rem;
        background: var(--p-surface-0);
        border-block-end: 1px solid var(--p-surface-200);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 700;
        color: var(--p-primary-700);
        text-decoration: none;
        img {
          width: 26px;
          height: 26px;
        }
      }
      .sign-in {
        color: var(--p-primary-600);
        font-weight: 600;
        text-decoration: none;
      }
      .public-content {
        padding: 2rem;
        max-width: 1100px;
        margin-inline: auto;
      }
    `,
  ],
})
export class PublicShellComponent {}
