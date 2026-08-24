import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AdminSquadsService } from '@core/services/admin-squads.service';
import { SquadListItemDto } from '@core/models/admin-squad-model';

@Component({
  selector: 'app-squads',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './squads.component.html',
  styleUrl: './squads.component.scss',
})
export class SquadsComponent implements OnInit {
  private squadsService = inject(AdminSquadsService);
  private router = inject(Router);
  private message = inject(MessageService);

  isLoading = signal(true);
  squads = signal<SquadListItemDto[]>([]);
  searchTerm = signal('');

  filteredSquads = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.squads();
    return this.squads().filter((s) => (s.name ?? '').toLowerCase().includes(term));
  });

  createDialogVisible = signal(false);
  isCreating = signal(false);
  newName = signal('');
  newDescription = signal('');

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
        this.message.add({
          severity: 'error',
          summary: 'Could not load squads',
          detail: 'Please try again in a moment.',
        });
      },
    });
  }

  openCreateDialog(): void {
    this.newName.set('');
    this.newDescription.set('');
    this.createDialogVisible.set(true);
  }

  createSquad(): void {
    const name = this.newName().trim();
    if (!name) {
      this.message.add({ severity: 'warn', summary: 'Name required', detail: 'Please enter a squad name.' });
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
        this.message.add({
          severity: 'error',
          summary: 'Could not create squad',
          detail: 'Please try again.',
        });
      },
    });
  }

  openSquad(squad: SquadListItemDto): void {
    this.router.navigate(['/console/admin/squads', squad.id]);
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  shortRef(id: string): string {
    return id.slice(0, 8);
  }
}