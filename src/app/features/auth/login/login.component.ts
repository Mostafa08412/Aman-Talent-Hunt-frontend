import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '@core/models/role.model';
import { dashboardRouteFor } from '../../../layout/sidebar/nav-config';
import { Toast } from 'primeng/toast';
import { environment } from '../../../../environments/environment';

interface TestAccount {
  fullName: string;
  email: string;
  role: Role;
}

const TEST_PASSWORD = 'Admin@12345';

const ROLE_TITLES: Record<Role, string> = {
  [Role.Candidate]: 'Candidate',
  [Role.Recruiter]: 'Recruiter',
  [Role.HiringManager]: 'Hiring Manager',
  [Role.DepartmentHead]: 'Department Head',
  [Role.FinanceApprover]: 'Finance Approver',
  [Role.HRManager]: 'HR Manager',
  [Role.OnboardingCoordinator]: 'Onboarding Coordinator',
  [Role.Admin]: 'Administrator',
  [Role.SuperAdmin]: 'Super Admin',
};

function roleTitle(role: Role): string {
  return ROLE_TITLES[role] ?? role;
}

const TEST_ACCOUNTS: TestAccount[] = [
  { fullName: 'System Administrator', email: 'sa@local.com', role: Role.SuperAdmin },
  { fullName: 'Yasmine Anwar', email: 'hr@local.com', role: Role.HRManager },
  { fullName: 'Ziad Hegazy', email: 'r1@local.com', role: Role.Recruiter },
  { fullName: 'Salma Alaa', email: 'r2@local.com', role: Role.Recruiter },
  { fullName: 'Tarek Nashed', email: 'hm@local.com', role: Role.HiringManager },
  { fullName: 'Youssef Rashidy', email: 'dh@local.com', role: Role.DepartmentHead },
  { fullName: 'Yotham Sameh', email: 'yotham@gmail.com', role: Role.Candidate },
  { fullName: 'Fardia Ahmed', email: 'fardia@gmail.com', role: Role.Candidate },
  { fullName: 'Hatem Hussien', email: 'hatem@gmail.com', role: Role.Candidate },
  { fullName: 'Ezz Elbishlawy', email: 'ezz@gmail.com', role: Role.Candidate },
  { fullName: 'Youssef Mamdouh', email: 'youssef@gmail.com', role: Role.Candidate },
  { fullName: 'Mostafa Medhat', email: 'mostafa@gmail.com', role: Role.Candidate },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, MessageModule, RouterLink, Toast, TooltipModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string | null>(null);

  readonly showTestAccounts = signal(environment.showTestAccounts);

  readonly testAccounts = TEST_ACCOUNTS;
  readonly testPassword = TEST_PASSWORD;

  readonly groupedAccounts = Object.values(Role)
    .filter((role) => TEST_ACCOUNTS.some((a) => a.role === role))
    .map((role) => ({
      role,
      label: roleTitle(role),
      accounts: TEST_ACCOUNTS.filter((a) => a.role === role),
    }));

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  fillAccount(account: TestAccount): void {
    this.form.patchValue({ email: account.email, password: TEST_PASSWORD });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        const role = this.auth.currentUser()?.role;
        if (role && role !== Role.Candidate) {
          this.router.navigateByUrl(dashboardRouteFor(role));
        } else {
          this.router.navigate(['/']);
        }
      },
      error: () => {
        this.error.set('This email and password combination is invalid, please try again.');
        this.loading.set(false);
      },
    });
  }
}
