import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-jobs-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jobs-hero.component.html',
  styleUrl: './jobs-hero.component.scss'
})
export class JobsHeroComponent {
  @Input() openRoles = 38;
  @Input() businessUnits = 12;
  @Input() teamMembers = '1.2K+';
}
