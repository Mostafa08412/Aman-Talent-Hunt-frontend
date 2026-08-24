import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AdminSquadsService } from '@core/services/admin-squads.service';
import { AdminDepartmentsService } from '@core/services/admin-departments.service';
import { AdminEmployeesService } from '@core/services/admin-employees.service';
import { SquadMemberDto, SquadResponse } from '@core/models/admin-squad-model';
import { DepartmentLookupDto } from '@core/models/admin-department-model';
import { EmployeeLookupDto } from '@core/models/admin-employee-model';

@Component({
  selector: 'app-squad-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    CheckboxModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './squad-detail.component.html',
  styleUrl: './squad-detail.component.scss',
})
export class SquadDetailComponent implements OnInit {
  private squadsService = inject(AdminSquadsService);
  private departmentsService = inject(AdminDepartmentsService);
  private employeesService = inject(AdminEmployeesService);
  private message = inject(MessageService);
  private confirmation = inject(ConfirmationService);

  // Bound automatically from the `:id` route param via withComponentInputBinding().
  id = input<string>('');

  isLoading = signal(true);
  squad = signal<SquadResponse | null>(null);

  employeeOptions = signal<EmployeeLookupDto[]>([]);
  departmentOptions = signal<DepartmentLookupDto[]>([]);

  // ── Edit name/description ──
  editDialogVisible = signal(false);
  isSavingEdit = signal(false);
  editName = signal('');
  editDescription = signal('');

  // ── Add member ──
  addMemberDialogVisible = signal(false);
  isAddingMember = signal(false);
  selectedEmployeeId = signal<string | null>(null);
  makeLeaderOnAdd = signal(false);

  // Employees not already in the squad.
  availableEmployees = computed(() => {
    const memberIds = new Set((this.squad()?.members ?? []).map((m) => m.employeeId));
    return this.employeeOptions().filter((e) => !memberIds.has(e.id));
  });

  // ── Assign / change leader ──
  leaderDialogVisible = signal(false);
  isAssigningLeader = signal(false);
  selectedLeaderId = signal<string | null>(null);

  // ── Map departments ──
  departmentsDialogVisible = signal(false);
  isSavingDepartments = signal(false);
  selectedDepartmentIds = signal<string[]>([]);

  ngOnInit(): void {
    this.load();
    this.departmentsService.getLookup().subscribe({
      next: (result) => this.departmentOptions.set(result.data ?? []),
    });
    this.employeesService.getLookup().subscribe({
      next: (result) => this.employeeOptions.set(result.data ?? []),
    });
  }

  private load(): void {
    const squadId = this.id();
    if (!squadId) return;
    this.isLoading.set(true);
    this.squadsService.getById(squadId).subscribe({
      next: (result) => {
        this.squad.set(result.data ?? null);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Could not load squad',
          detail: 'Please try again in a moment.',
        });
      },
    });
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  shortRef(id: string): string {
    return id.slice(0, 8);
  }

  // ── Edit name/description ──
  openEditDialog(): void {
    const squad = this.squad();
    if (!squad) return;
    this.editName.set(squad.name ?? '');
    this.editDescription.set(squad.description ?? '');
    this.editDialogVisible.set(true);
  }

  saveEdit(): void {
    const squad = this.squad();
    const name = this.editName().trim();
    if (!squad || !name) {
      this.message.add({ severity: 'warn', summary: 'Name required', detail: 'Please enter a squad name.' });
      return;
    }
    this.isSavingEdit.set(true);
    this.squadsService
      .update(squad.id, { name, description: this.editDescription().trim() || null })
      .subscribe({
        next: () => {
          this.isSavingEdit.set(false);
          this.editDialogVisible.set(false);
          this.message.add({ severity: 'success', summary: 'Saved', detail: 'Squad details updated.' });
          this.load();
        },
        error: () => {
          this.isSavingEdit.set(false);
          this.message.add({ severity: 'error', summary: 'Could not save', detail: 'Please try again.' });
        },
      });
  }

  // ── Add member ──
  openAddMemberDialog(): void {
    this.selectedEmployeeId.set(null);
    this.makeLeaderOnAdd.set(false);
    this.addMemberDialogVisible.set(true);
  }

  addMember(): void {
    const squad = this.squad();
    const employeeId = this.selectedEmployeeId();
    if (!squad || !employeeId) {
      this.message.add({ severity: 'warn', summary: 'Select an employee', detail: 'Please choose someone to add.' });
      return;
    }
    this.isAddingMember.set(true);
    this.squadsService.addMember(squad.id, { employeeId, isLeader: this.makeLeaderOnAdd() }).subscribe({
      next: () => {
        this.isAddingMember.set(false);
        this.addMemberDialogVisible.set(false);
        this.message.add({ severity: 'success', summary: 'Member added', detail: 'The squad has been updated.' });
        this.load();
      },
      error: () => {
        this.isAddingMember.set(false);
        this.message.add({ severity: 'error', summary: 'Could not add member', detail: 'Please try again.' });
      },
    });
  }

  // ── Remove member ──
  confirmRemoveMember(member: SquadMemberDto): void {
    const squad = this.squad();
    if (!squad) return;
    this.confirmation.confirm({
      header: 'Remove member',
      message: `Remove ${member.employeeName ?? 'this employee'} from ${squad.name}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.removeMember(squad.id, member),
    });
  }

  private removeMember(squadId: string, member: SquadMemberDto): void {
    this.squadsService.removeMember(squadId, member.employeeId).subscribe({
      next: () => {
        this.message.add({
          severity: 'warn',
          summary: 'Member removed',
          detail: `${member.employeeName ?? 'Employee'} was removed from the squad.`,
        });
        this.load();
      },
      error: () => {
        this.message.add({ severity: 'error', summary: 'Could not remove member', detail: 'Please try again.' });
      },
    });
  }

  // ── Assign / change leader ──
  openLeaderDialog(): void {
    this.selectedLeaderId.set(this.squad()?.leader?.employeeId ?? null);
    this.leaderDialogVisible.set(true);
  }

  assignLeader(): void {
    const squad = this.squad();
    const employeeId = this.selectedLeaderId();
    if (!squad || !employeeId) {
      this.message.add({ severity: 'warn', summary: 'Select a member', detail: 'Please choose a leader.' });
      return;
    }
    this.isAssigningLeader.set(true);
    this.squadsService.assignLeader(squad.id, { employeeId }).subscribe({
      next: () => {
        this.isAssigningLeader.set(false);
        this.leaderDialogVisible.set(false);
        this.message.add({ severity: 'success', summary: 'Leader updated', detail: 'The squad leader has changed.' });
        this.load();
      },
      error: () => {
        this.isAssigningLeader.set(false);
        this.message.add({ severity: 'error', summary: 'Could not assign leader', detail: 'Please try again.' });
      },
    });
  }

  // ── Map departments ──
  openDepartmentsDialog(): void {
    const current = this.squad()?.departments ?? [];
    this.selectedDepartmentIds.set(current.map((d) => d.id));
    this.departmentsDialogVisible.set(true);
  }

  saveDepartments(): void {
    const squad = this.squad();
    if (!squad) return;
    this.isSavingDepartments.set(true);
    this.squadsService.mapDepartments(squad.id, { departmentIds: this.selectedDepartmentIds() }).subscribe({
      next: () => {
        this.isSavingDepartments.set(false);
        this.departmentsDialogVisible.set(false);
        this.message.add({ severity: 'success', summary: 'Departments updated', detail: 'Coverage has been saved.' });
        this.load();
      },
      error: () => {
        this.isSavingDepartments.set(false);
        this.message.add({ severity: 'error', summary: 'Could not save departments', detail: 'Please try again.' });
      },
    });
  }
}