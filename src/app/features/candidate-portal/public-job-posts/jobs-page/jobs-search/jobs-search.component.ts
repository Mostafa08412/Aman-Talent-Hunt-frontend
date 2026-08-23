import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Location } from '@core/models';

export interface JobsSearchPayload {
  search: string;
  location: Location | null;
}

@Component({
  selector: 'app-jobs-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './jobs-search.component.html',
  styleUrl: './jobs-search.component.scss'
})
export class JobsSearchComponent {
  @Output() search = new EventEmitter<JobsSearchPayload>();

  keyword = '';
  selectedLocation: Location | null = null;

  locationOptions = [
    { label: 'All Cities', value: null },
    { label: 'Cairo', value: Location.Cairo },
    { label: 'Giza', value: Location.Giza },
    { label: 'Alexandria', value: Location.Alexandria },
    { label: 'Riyadh', value: Location.Riyadh }
  ];

  onSearch(): void {
    this.search.emit({
      search: this.keyword.trim(),
      location: this.selectedLocation
    });
  }

  onClear(): void {
    this.keyword = '';
    this.selectedLocation = null;
    this.onSearch();
  }
}
