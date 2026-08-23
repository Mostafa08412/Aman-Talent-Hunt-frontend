import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-header',
  imports: [CommonModule, RouterModule, ButtonModule, MenuModule, AvatarModule],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss'
})
export class PublicHeaderComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  isLoggedIn = this.auth.isLoggedIn;
  currentUser = this.auth.currentUser;

  initials = computed(() => {
    const name = this.currentUser()?.fullName ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  });

  userMenuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', command: () => this.router.navigate(['/account']) },
    { separator: true },
    { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.auth.logout() },
  ];
}