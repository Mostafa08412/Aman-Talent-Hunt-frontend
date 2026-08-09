import { Component } from "@angular/core";
import { CardModule } from "primeng/card";

@Component({
  selector: "app-approvals",
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Approvals Queue</h1>
      </div>
      <p-card>
        <div class="stub-body">
          <i class="pi pi-check-square"></i>
          <p>Approvals Queue screen — build against Module DTOs from the .NET API once available.</p>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .stub-body { display:flex; flex-direction:column; align-items:center; gap:.75rem; padding:2.5rem 1rem; color: var(--p-surface-400); }
    .stub-body i { font-size: 2rem; }
  `],
})
export class ApprovalsComponent {}
