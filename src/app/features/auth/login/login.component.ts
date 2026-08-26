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
import { Toast } from 'primeng/toast';
import { environment } from '../../../../environments/environment';

interface TestAccount {
  fullName: string;
  email: string;
  role: Role;
}

const TEST_PASSWORD = 'Admin@12345';

const TEST_ACCOUNTS: TestAccount[] = [
  // Super Admin
  { fullName: 'System Administrator', email: 'sa@local.com', role: Role.SuperAdmin },
  // Recruiters
  { fullName: 'Sara Khalil', email: 'r1@local.com', role: Role.Recruiter },
  { fullName: 'Omar Youssef', email: 'r2@local.com', role: Role.Recruiter },
  { fullName: 'Ahmed Emad', email: 'r3@local.com', role: Role.Recruiter },
  // HR Managers
  { fullName: 'Ahmed Hassan', email: 'hr@local.com', role: Role.HRManager },
  { fullName: 'Nour El-Sayed', email: 'hr1@local.com', role: Role.HRManager },
  { fullName: 'Hana Kamel', email: 'hr2@local.com', role: Role.HRManager },
  { fullName: 'Laila Mansour', email: 'hr3@local.com', role: Role.HRManager },
  // Department Heads
  { fullName: 'Khaled Mostafa', email: 'dh@local.com', role: Role.DepartmentHead },
  { fullName: 'Mahmoud Salem', email: 'dh1@local.com', role: Role.DepartmentHead },
  { fullName: 'Reem Ghanem', email: 'dh2@local.com', role: Role.DepartmentHead },
  { fullName: 'Yara Radi', email: 'dh3@local.com', role: Role.DepartmentHead },
  { fullName: 'Mostafa Zaki', email: 'dh4@local.com', role: Role.DepartmentHead },
  { fullName: 'Tarek Fahmy', email: 'dh5@local.com', role: Role.DepartmentHead },
  { fullName: 'Hazem El-Sherif', email: 'dh6@local.com', role: Role.DepartmentHead },
  { fullName: 'Dina Mansour', email: 'dh7@local.com', role: Role.DepartmentHead },
  // Hiring Manager
  { fullName: 'Mohamed Ali', email: 'hm@local.com', role: Role.HiringManager },
  // Candidates
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
        } else if (this.auth.currentUser()?.role === Role.Candidate) this.router.navigate(['/']);
        else this.router.navigate(['/console']);
      },
      error: () => {
        this.error.set('This email and password combination is invalid, please try again.');
        this.loading.set(false);
      },
    });
  }
}
