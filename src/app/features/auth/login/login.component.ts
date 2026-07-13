import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

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
  imports: [ReactiveFormsModule],
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
            @if (
              loginForm.get('username')?.invalid &&
              loginForm.get('username')?.touched
              ) {
              <div
                class="error"
                >
                Usuario requerido
              </div>
            }
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
            @if (
              loginForm.get('password')?.invalid &&
              loginForm.get('password')?.touched
              ) {
              <div
                class="error"
                >
                Contraseña requerida
              </div>
            }
          </div>
    
          @if (errorMessage) {
            <div class="error">
              {{ errorMessage }}
            </div>
          }
    
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background:
          radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.22), transparent 28rem),
          radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.1), transparent 24rem),
          var(--bg-primary);
        padding: 20px;
      }

      .login-card {
        background: rgba(24, 34, 53, 0.92);
        padding: 42px;
        border-radius: 18px;
        box-shadow: 0 28px 64px -32px rgba(0, 0, 0, 0.95);
        max-width: 420px;
        width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.22);
        backdrop-filter: blur(16px);
      }

      h2 {
        margin-bottom: 10px;
        color: var(--text-primary);
        text-align: center;
        font-size: 28px;
        letter-spacing: -0.6px;
      }

      .subtitle {
        text-align: center;
        color: var(--text-muted);
        margin-bottom: 30px;
      }

      .form-group {
        margin-bottom: 20px;
      }

      label {
        display: block;
        margin-bottom: 5px;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .form-control {
        width: 100%;
        min-height: 44px;
        padding: 12px 14px;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        font-size: 14px;
        box-sizing: border-box;
        background: var(--bg-secondary);
        color: var(--text-primary);
      }

      .form-control::placeholder {
        color: var(--text-muted);
      }

      .form-control:focus {
        outline: none;
        border-color: var(--primary-light);
        box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.16);
      }

      .error {
        color: var(--danger);
        font-size: 12px;
        margin-top: 5px;
      }

      .btn-primary {
        width: 100%;
        padding: 13px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.2s, filter 0.2s;
        box-shadow: 0 14px 26px -18px rgba(37, 99, 235, 0.95);
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.08);
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
