import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-job-board',
  standalone: true,
  imports: [CardModule],
  templateUrl: './job-board.component.html',
  styleUrl: './job-board.component.scss',
})
export class JobBoardComponent {}
