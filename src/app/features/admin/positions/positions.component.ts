import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';

import { AdminService } from '../../../core/services/admin.service';
import { Position, CreatePositionRequest, PositionStatus } from '../../../core/models/admin.models';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './positions.component.html',
  styleUrl: './positions.component.scss',
})
export class PositionsComponent implements OnInit {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmationService);

  positions = this.adminService.positions;
  departments = this.adminService.departments;
  searchValue = '';

  /* Dialog */
  dialogVisible = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');

  formCode = '';
  formTitle = '';
  formDepartment = '';
  formApproved: number = 1;
  formStatus: PositionStatus = 'Draft';
  editingPositionId: string | null = null;

  departmentOptions: { label: string; value: string }[] = [];

  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Draft', value: 'Draft' },
  ];

  ngOnInit(): void {
    this.adminService.loadPositions();
    this.departmentOptions = this.departments().map((d) => ({ label: d.name, value: d.name }));
  }

  /* ── Helpers ── */

  getStatusSeverity(status: string): 'success' | 'info' {
    return status === 'Active' ? 'success' : 'info';
  }

  /* ── CRUD ── */

  openCreateDialog(): void {
    this.dialogMode.set('create');
    this.formCode = '';
    this.formTitle = '';
    this.formDepartment = '';
    this.formApproved = 1;
    this.formStatus = 'Draft';
    this.editingPositionId = null;
    this.dialogVisible.set(true);
  }

  openEditDialog(pos: Position): void {
    this.dialogMode.set('edit');
    this.formCode = pos.code;
    this.formTitle = pos.title;
    this.formDepartment = pos.department;
    this.formApproved = pos.approved;
    this.formStatus = pos.status;
    this.editingPositionId = pos.id;
    this.dialogVisible.set(true);
  }

  savePosition(): void {
    if (this.dialogMode() === 'create') {
      const req: CreatePositionRequest = {
        code: this.formCode,
        title: this.formTitle,
        departmentId: this.formDepartment,
        approved: this.formApproved,
        status: this.formStatus,
      };
      this.adminService.createPosition(req).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Created', detail: `Position "${req.code}" created.` });
        this.dialogVisible.set(false);
      });
    } else {
      this.adminService.updatePosition(this.editingPositionId!, {
        code: this.formCode,
        title: this.formTitle,
        department: this.formDepartment,
        approved: this.formApproved,
        status: this.formStatus,
      }).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Position updated.' });
        this.dialogVisible.set(false);
      });
    }
  }

  confirmDelete(pos: Position): void {
    this.confirmService.confirm({
      message: `Delete position "${pos.code} — ${pos.title}"?`,
      header: 'Delete Position',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.adminService.deletePosition(pos.id).subscribe(() => {
          this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: `Position "${pos.code}" removed.` });
        });
      },
    });
  }
}
