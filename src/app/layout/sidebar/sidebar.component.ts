import { Component, computed, inject, input, model, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { NAV_CONFIG, NavGroup } from './nav-config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private auth = inject(AuthService);

  /** Two-way bound from the console shell so the toggle button in the header can drive this too. */
  collapsed = model(false);

  currentUser = this.auth.currentUser;

  // Placeholder count — wire to ApprovalService once the pending-approvals API is ready.
  pendingApprovals = signal(0);

  /** Nav groups filtered down to what the signed-in role can see; groups left empty after filtering are dropped. */
  visibleGroups = computed<NavGroup[]>(() => {
    const role = this.auth.role();
    return NAV_CONFIG.map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
    })).filter((group) => group.items.length > 0);
  });
}
