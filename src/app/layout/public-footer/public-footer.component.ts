import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-public-footer',
imports: [CommonModule, RouterModule],
  templateUrl: './public-footer.component.html',
  styleUrl: './public-footer.component.scss'
})
export class PublicFooterComponent {
currentYear = new Date().getFullYear();
}
