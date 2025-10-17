import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="card">
        <h2>Cambiar Contraseña</h2>
        
        <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="oldPassword">Contraseña Actual</label>
            <input 
              type="password" 
              id="oldPassword" 
              formControlName="oldPassword" 
              class="form-control">
            <div class="error" *ngIf="passwordForm.get('oldPassword')?.invalid && passwordForm.get('oldPassword')?.touched">
              Contraseña actual requerida
            </div>
          </div>

          <div class="form-group">
            <label for="newPassword">Nueva Contraseña</label>
            <input 
              type="password" 
              id="newPassword" 
              formControlName="newPassword" 
              class="form-control"
              placeholder="Mínimo 6 caracteres">
            <div class="error" *ngIf="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched">
              Nueva contraseña requerida (mínimo 6 caracteres)
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Nueva Contraseña</label>
            <input 
              type="password" 
              id="confirmPassword" 
              formControlName="confirmPassword" 
              class="form-control">
            <div class="error" *ngIf="passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched">
              Las contraseñas no coinciden
            </div>
          </div>

          <div class="error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="success" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <div class="actions">
            <button type="button" class="btn-secondary" (click)="cancelar()">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn-primary" 
              [disabled]="passwordForm.invalid || isLoading">
              {{ isLoading ? 'Guardando...' : 'Cambiar Contraseña' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 500px;
      margin: 40px auto;
      padding: 20px;
    }

    .card {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    h2 {
      margin-bottom: 30px;
      color: #333;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      color: #555;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .error {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .success {
      color: #28a745;
      padding: 10px;
      background: #d4edda;
      border-radius: 4px;
      margin-bottom: 15px;
    }

    .actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 30px;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ChangePasswordComponent {
  passwordForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { oldPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword({ oldPassword, newPassword }).subscribe({
      next: () => {
        this.successMessage = 'Contraseña actualizada correctamente';
        this.passwordForm.reset();
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/consolidados']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = 'Error al cambiar contraseña';
        this.isLoading = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/consolidados']);
  }
}