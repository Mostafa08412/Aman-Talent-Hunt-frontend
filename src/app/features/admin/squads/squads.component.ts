import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { AdminSquadsService } from '@core/services/admin-squads.service';
import { SquadListItemDto } from '@core/models/admin-squad-model';

@Component({
  selector: 'app-squads',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './squads.component.html',
  styleUrl: './squads.component.scss',
})
export class SquadsComponent implements OnInit {
  private squadsService = inject(AdminSquadsService);
  private router = inject(Router);
  private message = inject(MessageService);

  isLoading = signal(true);
  squads = signal<SquadListItemDto[]>([]);

  search = '';
  private appliedSearch = '';

  readonly page = signal(1);
  readonly pageSize = 10;

  createDialogVisible = signal(false);
  isCreating = signal(false);
  newName = signal('');
  newDescription = signal('');

  filteredSquads = computed(() => {
    const term = this.appliedSearch.trim().toLowerCase();
    if (!term) return this.squads();
    return this.squads().filter((s) => (s.name ?? '').toLowerCase().includes(term));
  });

  paginatedSquads = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredSquads().slice(start, start + this.pageSize);
  });

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSquads().length / this.pageSize));
  }

  get rangeStart(): number {
    if (this.filteredSquads().length === 0) return 0;
    return (this.page() - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page() * this.pageSize, this.filteredSquads().length);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page();

    if (total <= 6) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const wanted = [current - 1, current, current + 1, total].filter(
      (pageNumber) => pageNumber >= 1 && pageNumber <= total,
    );

    return [...new Set([1, ...wanted])].sort((a, b) => a - b);
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.squadsService.getList().subscribe({
      next: (result) => {
        this.squads.set(result.data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.appliedSearch = this.search.trim();
    this.page.set(1);
  }

  clearFilters(): void {
    this.search = '';
    this.appliedSearch = '';
    this.page.set(1);
  }

  goToPage(pageNumber: number): void {
    const clamped = Math.min(Math.max(1, pageNumber), this.totalPages);
    if (clamped === this.page()) return;
    this.page.set(clamped);
  }

  previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  openCreateDialog(): void {
    this.newName.set('');
    this.newDescription.set('');
    this.createDialogVisible.set(true);
  }

  createSquad(): void {
    const name = this.newName().trim();
    if (!name) {
      return;
    }
    this.isCreating.set(true);
    this.squadsService.create({ name, description: this.newDescription().trim() || null }).subscribe({
      next: () => {
        this.isCreating.set(false);
        this.createDialogVisible.set(false);
        this.message.add({ severity: 'success', summary: 'Squad created', detail: `"${name}" has been created.` });
        this.load();
      },
      error: () => {
        this.isCreating.set(false);
      },
    });
  }

  openSquad(squad: SquadListItemDto): void {
    this.router.navigate(['/console/admin/squads', squad.id]);
  }

  referenceCode(squad: SquadListItemDto): string {
    return squad.referenceNumber || squad.id.slice(0, 8).toUpperCase();
  }
}
