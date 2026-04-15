import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) return null;
  const missing: string[] = [];
  if (!/[A-Z]/.test(value)) missing.push('uppercase letter');
  if (!/[a-z]/.test(value)) missing.push('lowercase letter');
  if (!/\d/.test(value)) missing.push('number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) missing.push('special character');
  return missing.length ? { passwordStrength: missing } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    number: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{6,14}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]]
  });

  showPassword = false;
  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  readonly passwordRules = [
    { label: 'Uppercase', test: (v: string) => /[A-Z]/.test(v) },
    { label: 'Lowercase', test: (v: string) => /[a-z]/.test(v) },
    { label: 'Number',    test: (v: string) => /\d/.test(v) },
    { label: 'Special',   test: (v: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(v) },
    { label: '8+ chars',  test: (v: string) => v.length >= 8 }
  ];

  get name() { return this.form.get('name')!; }
  get email() { return this.form.get('email')!; }
  get number() { return this.form.get('number')!; }
  get password() { return this.form.get('password')!; }

  get passwordStrengthMissing(): string[] {
    return this.password.errors?.['passwordStrength'] ?? [];
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = null;
    this.errorMessage = null;

    this.authService.register(this.form.getRawValue() as any).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = res.message;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message ?? 'Registration failed. Please try again.';
      }
    });
  }
}
