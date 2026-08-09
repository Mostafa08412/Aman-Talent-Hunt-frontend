import { Component, computed, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ButtonModule, MenuModule, AvatarModule, BadgeModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private auth = inject(AuthService);

  toggleSidebar = output<void>();

  currentUser = this.auth.currentUser;
  isDark = signal(localStorage.getItem('ath_theme') === 'dark');

  // Placeholder counts — wire to a NotificationsService / ApprovalsService once the API is ready.
  pendingApprovals = signal(0);

  initials = computed(() => {
    const name = this.currentUser()?.fullName ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  });

  userMenuItems: MenuItem[] = [
    { label: 'My Profile', icon: 'pi pi-user' },
    { label: 'Settings', icon: 'pi pi-cog' },
    { separator: true },
    { label: 'Sign Out', icon: 'pi pi-sign-out', command: () => this.auth.logout() },
  ];

  toggleDarkMode(): void {
    this.isDark.update((v) => !v);
    document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
    localStorage.setItem('ath_theme', this.isDark() ? 'dark' : 'light');
  }
}
