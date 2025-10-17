import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <h2>Crear Cuenta</h2>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username" 
              class="form-control"
              placeholder="Nombre de usuario">
            <div class="error" *ngIf="registerForm.get('username')?.invalid && registerForm.get('username')?.touched">
              Usuario requerido (mínimo 3 caracteres)
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              class="form-control"
              placeholder="usuario@ejemplo.com">
            <div class="error" *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
              Email válido requerido
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-control"
              placeholder="Mínimo 6 caracteres">
            <div class="error" *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
              Contraseña requerida (mínimo 6 caracteres)
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <input 
              type="password" 
              id="confirmPassword" 
              formControlName="confirmPassword" 
              class="form-control"
              placeholder="Repita la contraseña">
            <div class="error" *ngIf="registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched">
              Las contraseñas no coinciden
            </div>
          </div>

          <div class="error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="success" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <button 
            type="submit" 
            class="btn-primary" 
            [disabled]="registerForm.invalid || isLoading">
            {{ isLoading ? 'Registrando...' : 'Registrarse' }}
          </button>
        </form>

        <div class="login-link">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión aquí</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
      padding: 20px;
    }

    .register-card {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 450px;
    }

    h2 {
      text-align: center;
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

    .form-control:focus {
      outline: none;
      border-color: #007bff;
    }

    .error {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .success {
      color: #28a745;
      font-size: 14px;
      margin-bottom: 10px;
      padding: 10px;
      background: #d4edda;
      border-radius: 4px;
    }

    .btn-primary {
      width: 100%;
      padding: 12px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 10px;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .login-link {
      text-align: center;
      margin-top: 20px;
      color: #666;
    }

    .login-link a {
      color: #007bff;
      text-decoration: none;
    }

    .login-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { username, email, password } = this.registerForm.value;

    this.authService.register({ username, email, password }).subscribe({
      next: () => {
        this.successMessage = 'Usuario registrado correctamente. Redirigiendo...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = 'Error al registrar usuario';
        this.isLoading = false;
      }
    });
  }
}