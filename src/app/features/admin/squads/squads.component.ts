import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { AdminService } from '../../../core/services/admin.service';
import { Squad, SquadMember } from '../../../core/models/admin.models';

@Component({
  selector: 'app-squads',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    InputTextModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './squads.component.html',
  styleUrl: './squads.component.scss',
})
export class SquadsComponent implements OnInit {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmationService);

  squads = this.adminService.squads;

  /* Dialog state */
  dialogVisible = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');

  formName = '';
  formDepartments = '';
  editingSquadId: string | null = null;

  /* Member management */
  memberDialogVisible = signal(false);
  selectedSquad = signal<Squad | null>(null);
  newMemberName = '';
  newMemberRole = '';

  ngOnInit(): void {
    this.adminService.loadSquads();
  }

  /* ── Squad CRUD ── */

  openCreateDialog(): void {
    this.dialogMode.set('create');
    this.formName = '';
    this.formDepartments = '';
    this.editingSquadId = null;
    this.dialogVisible.set(true);
  }

  openEditDialog(squad: Squad): void {
    this.dialogMode.set('edit');
    this.formName = squad.name;
    this.formDepartments = squad.departments.join(', ');
    this.editingSquadId = squad.id;
    this.dialogVisible.set(true);
  }

  saveSquad(): void {
    const depts = this.formDepartments.split(',').map((d) => d.trim()).filter(Boolean);

    if (this.dialogMode() === 'create') {
      this.adminService.createSquad({
        name: this.formName,
        departments: depts,
        memberIds: [],
        leaderId: '',
      }).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Created', detail: `Squad "${this.formName}" created.` });
        this.dialogVisible.set(false);
      });
    } else {
      this.adminService.updateSquad(this.editingSquadId!, {
        name: this.formName,
        departments: depts,
      }).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Squad updated.' });
        this.dialogVisible.set(false);
      });
    }
  }

  confirmDeleteSquad(squad: Squad): void {
    this.confirmService.confirm({
      message: `Delete squad "${squad.name}"? All member assignments will be removed.`,
      header: 'Delete Squad',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.adminService.deleteSquad(squad.id).subscribe(() => {
          this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: `Squad "${squad.name}" removed.` });
        });
      },
    });
  }

  /* ── Member helpers ── */

  openMemberDialog(squad: Squad): void {
    this.selectedSquad.set(squad);
    this.newMemberName = '';
    this.newMemberRole = '';
    this.memberDialogVisible.set(true);
  }

  addMember(): void {
    const squad = this.selectedSquad();
    if (!squad) return;

    const newMember: SquadMember = {
      id: `m${Date.now()}`,
      fullName: this.newMemberName,
      role: this.newMemberRole,
      isLeader: false,
    };

    this.adminService.updateSquad(squad.id, {
      members: [...squad.members, newMember],
    }).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Added', detail: `${this.newMemberName} added to ${squad.name}.` });
      this.newMemberName = '';
      this.newMemberRole = '';
      /* Refresh the selectedSquad reference */
      this.selectedSquad.set(this.squads().find((s) => s.id === squad.id) ?? null);
    });
  }

  removeMember(squad: Squad, member: SquadMember): void {
    this.adminService.updateSquad(squad.id, {
      members: squad.members.filter((m) => m.id !== member.id),
    }).subscribe(() => {
      this.messageService.add({ severity: 'warn', summary: 'Removed', detail: `${member.fullName} removed from ${squad.name}.` });
      this.selectedSquad.set(this.squads().find((s) => s.id === squad.id) ?? null);
    });
  }

  getLeader(squad: Squad): SquadMember | undefined {
    return squad.members.find((m) => m.isLeader);
  }
}
