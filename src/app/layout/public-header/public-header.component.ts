import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { DrawerModule } from 'primeng/drawer';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { Roles } from '@core/models';
import { Role } from '@core/models/role.model';

@Component({
  selector: 'app-public-header',
  imports: [CommonModule, RouterModule, ButtonModule, MenuModule, AvatarModule, DrawerModule],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss'
})
export class PublicHeaderComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);

  isLoggedIn = this.auth.isLoggedIn;
  currentUser = this.auth.currentUser;

  mobileMenuVisible = signal(false);

  initials = computed(() => {
    const name = this.currentUser()?.fullName ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  });
  isUserCandidate: boolean = this.auth.hasRole(Role.Candidate);

  profileRoute: string = this.isUserCandidate ? `/account` : `/console/profile`;

  userMenuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', command: () => this.router.navigate([this.profileRoute]) },
    { separator: true },
    { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.auth.logout() },
  ];
}
