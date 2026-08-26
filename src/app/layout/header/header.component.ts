import { Component, inject, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, MenuModule, TooltipModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  toggleSidebar = output<void>();

  currentUser = this.auth.currentUser;
  isDark = signal(localStorage.getItem('ath_theme') === 'dark');

  userMenuItems: MenuItem[] = [
    { label: 'My Profile', icon: 'pi pi-user', command: () => this.router.navigate(['/console/profile']) },
    { separator: true },
    { label: 'Sign Out', icon: 'pi pi-sign-out', command: () => this.auth.logout() },
  ];

  toggleDarkMode(): void {
    this.isDark.update((v) => !v);
    document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
    localStorage.setItem('ath_theme', this.isDark() ? 'dark' : 'light');
  }
}
