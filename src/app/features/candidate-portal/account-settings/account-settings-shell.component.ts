import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account-settings-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './account-settings-shell.component.html',
  styleUrl: './account-settings-shell.component.scss',
})
export class AccountSettingsShellComponent {}