import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Iniciar Sesión</h2>
        <p class="subtitle">Sistema de Consolidación</p>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input
              type="text"
              id="username"
              formControlName="username"
              class="form-control"
              placeholder="Ingresa tu usuario"
            />
            <div
              class="error"
              *ngIf="
                loginForm.get('username')?.invalid &&
                loginForm.get('username')?.touched
              "
            >
              Usuario requerido
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              placeholder="Ingresa tu contraseña"
            />
            <div
              class="error"
              *ngIf="
                loginForm.get('password')?.invalid &&
                loginForm.get('password')?.touched
              "
            >
              Contraseña requerida
            </div>
          </div>

          <div class="error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn-primary btn-block"
            [disabled]="loginForm.invalid || isLoading"
          >
            {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
      }

      .login-card {
        background: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        max-width: 400px;
        width: 100%;
      }

      h2 {
        margin-bottom: 10px;
        color: #333;
        text-align: center;
      }

      .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 30px;
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
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }

      .form-control:focus {
        outline: none;
        border-color: #667eea;
      }

      .error {
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
      }

      .btn-primary {
        width: 100%;
        padding: 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.3s;
      }

      .btn-primary:hover:not(:disabled) {
        background: #5568d3;
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-block {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated()) {
      this.redirectUser();
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        this.notificationService.success('Bienvenido');
        this.redirectUser();
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.isLoading = false;

        // Manejo detallado de errores
        if (error.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        } else if (error.status === 0) {
          this.errorMessage =
            'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else if (error.status === 403) {
          this.errorMessage = 'Acceso denegado';
        } else if (error.status === 404) {
          this.errorMessage = 'Servicio no disponible';
        } else if (error.status === 500) {
          this.errorMessage = 'Error en el servidor. Intenta nuevamente.';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intenta nuevamente.';
        }
      },
    });
  }

  private redirectUser(): void {
    // Redirigir según el rol del usuario
    if (this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/consolidados']);
    }
  }
}
