import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-console-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './console-shell.component.html',
  styleUrl: './console-shell.component.scss',
})
export class ConsoleShellComponent {
  sidebarCollapsed = signal(false);
}
