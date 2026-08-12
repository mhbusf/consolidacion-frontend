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
    <div class="login-shell">
      <section class="hero-panel" aria-label="Presentacion del sistema">
        <div class="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3.4 5.8 6.1v5.2c0 4.3 2.6 8.1 6.2 9.3 3.6-1.2 6.2-5 6.2-9.3V6.1L12 3.4Z"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div class="hero-copy">
          <h1>Consolidacion con <span>foco pastoral</span> y seguimiento real</h1>
          <p>
            Administra asignaciones, comentarios, atrasos e historico GDC desde
            una experiencia moderna.
          </p>
        </div>
      </section>

      <section class="form-panel" aria-label="Acceso al sistema">
        <div class="login-card">
          <p class="eyebrow">Acceso seguro</p>
          <h2>Iniciar sesion</h2>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="username">Usuario</label>
              <div class="input-wrap">
                <input
                  type="text"
                  id="username"
                  formControlName="username"
                  class="form-control"
                  autocomplete="username"
                  placeholder="Ingresa tu usuario"
                />
                <span class="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 7.5a4 4 0 1 1-2.9-3.85A4 4 0 0 1 15 7.5Z"
                      stroke="currentColor"
                      stroke-width="1.7"
                    />
                    <path
                      d="m14.7 10.3 6 6m-2.1-2.1-2.2 2.2m4.2 0-1.7 1.7"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
              </div>
              @if (
                loginForm.get('username')?.invalid &&
                loginForm.get('username')?.touched
                ) {
                <div class="error">Usuario requerido</div>
              }
            </div>

            <div class="form-group">
              <label for="password">Clave</label>
              <input
                type="password"
                id="password"
                formControlName="password"
                class="form-control"
                autocomplete="current-password"
                placeholder="Ingresa tu clave"
              />
              @if (
                loginForm.get('password')?.invalid &&
                loginForm.get('password')?.touched
                ) {
                <div class="error">Clave requerida</div>
              }
            </div>

            @if (errorMessage) {
              <div class="error error-message">
                {{ errorMessage }}
              </div>
            }

            <button
              type="submit"
              class="btn-primary btn-block"
              [disabled]="loginForm.invalid || isLoading"
              >
              {{ isLoading ? 'Iniciando sesion...' : 'Entrar' }}
            </button>
          </form>
        </div>
      </section>
    </div>
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      :host {
        display: block;
      }

      .login-shell {
        position: relative;
        min-height: 100vh;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(420px, 0.72fr);
        align-items: center;
        gap: clamp(36px, 7vw, 112px);
        background:
          radial-gradient(circle at 44% 32%, rgba(46, 82, 191, 0.62), transparent 18rem),
          radial-gradient(circle at 55% 95%, rgba(63, 178, 160, 0.7), transparent 21rem),
          linear-gradient(180deg, #08111d 0%, #07101c 100%);
        overflow: hidden;
        padding: clamp(32px, 5vw, 88px);
      }

      .login-shell::before,
      .login-shell::after {
        content: '';
        position: absolute;
        pointer-events: none;
      }

      .login-shell::before {
        inset: auto auto -16% 39%;
        width: 30rem;
        height: 30rem;
        background: rgba(75, 205, 179, 0.38);
        filter: blur(52px);
      }

      .login-shell::after {
        inset: 0;
        background: linear-gradient(90deg, rgba(7, 16, 28, 0) 0%, rgba(7, 16, 28, 0.82) 68%);
      }

      .hero-panel,
      .form-panel {
        position: relative;
        z-index: 1;
      }

      .hero-panel {
        max-width: 760px;
      }

      .brand-icon {
        display: grid;
        place-items: center;
        width: 96px;
        height: 96px;
        margin-bottom: clamp(42px, 8vh, 86px);
        color: white;
        background: linear-gradient(135deg, #7dd3fc 0%, #7c3aed 100%);
        border-radius: 28px;
        box-shadow: 0 30px 70px -34px rgba(96, 165, 250, 0.95);
      }

      .brand-icon svg {
        width: 48px;
        height: 48px;
      }

      .hero-copy h1 {
        max-width: 700px;
        margin: 0;
        color: #ffffff;
        font-size: clamp(54px, 6.2vw, 112px);
        font-weight: 900;
        line-height: 0.95;
        letter-spacing: -0.075em;
      }

      .hero-copy h1 span {
        color: #a9bdff;
      }

      .hero-copy p {
        max-width: 610px;
        margin-top: clamp(34px, 5vh, 64px);
        color: #c2cce0;
        font-size: clamp(20px, 1.45vw, 28px);
        font-weight: 500;
        line-height: 1.24;
        letter-spacing: -0.035em;
      }

      .form-panel {
        display: flex;
        justify-content: center;
      }

      .login-card {
        background: #f4f4f5;
        padding: clamp(34px, 3vw, 48px);
        border-radius: 40px;
        box-shadow: 0 36px 90px -46px rgba(0, 0, 0, 0.72);
        max-width: 590px;
        width: 100%;
        color: #101827;
      }

      .eyebrow {
        margin-bottom: 8px;
        color: #6d7890;
        font-size: 15px;
        font-weight: 900;
        letter-spacing: 0.32em;
        text-transform: uppercase;
      }

      h2 {
        margin: 0 0 22px;
        color: #111827;
        font-size: clamp(30px, 2.4vw, 38px);
        font-weight: 900;
        letter-spacing: -0.06em;
      }

      .form-group {
        margin-bottom: 18px;
      }

      label {
        display: block;
        margin-bottom: 7px;
        color: #334155;
        font-size: 17px;
        font-weight: 850;
        letter-spacing: -0.03em;
      }

      .input-wrap {
        position: relative;
      }

      .input-icon {
        position: absolute;
        top: 50%;
        right: 16px;
        display: grid;
        place-items: center;
        width: 36px;
        height: 32px;
        color: #1f2937;
        background: #e8e8eb;
        border-radius: 9px;
        transform: translateY(-50%);
      }

      .input-icon svg {
        width: 22px;
        height: 22px;
      }

      .form-control {
        width: 100%;
        min-height: 62px;
        padding: 16px 20px;
        border: 1px solid #cbd5e1;
        border-radius: 18px;
        font-size: 17px;
        font-weight: 800;
        box-sizing: border-box;
        background: #ffffff;
        color: #111827;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .input-wrap .form-control {
        padding-right: 66px;
      }

      .form-control::placeholder {
        color: #94a3b8;
        font-weight: 600;
      }

      .form-control:focus {
        outline: none;
        border-color: #3365ff;
        box-shadow: 0 0 0 6px rgba(79, 118, 255, 0.18);
      }

      .error {
        color: #dc2626;
        font-size: 13px;
        font-weight: 700;
        margin-top: 7px;
      }

      .error-message {
        margin: 0 0 16px;
        padding: 12px 14px;
        background: rgba(220, 38, 38, 0.08);
        border: 1px solid rgba(220, 38, 38, 0.18);
        border-radius: 14px;
      }

      .btn-primary {
        width: 100%;
        min-height: 60px;
        margin-top: 8px;
        padding: 15px;
        background: linear-gradient(100deg, #3155d8 0%, #0d183d 100%);
        color: white;
        border: none;
        border-radius: 16px;
        font-size: 22px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.2s, filter 0.2s;
        box-shadow: 0 18px 42px -24px rgba(30, 64, 175, 0.9);
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

      @media (max-width: 1040px) {
        .login-shell {
          grid-template-columns: 1fr;
          align-items: start;
          gap: 36px;
        }

        .login-shell::after {
          background: linear-gradient(180deg, rgba(7, 16, 28, 0) 0%, rgba(7, 16, 28, 0.58) 100%);
        }

        .hero-panel {
          max-width: 850px;
        }

        .brand-icon {
          width: 78px;
          height: 78px;
          margin-bottom: 34px;
          border-radius: 24px;
        }

        .brand-icon svg {
          width: 40px;
          height: 40px;
        }

        .hero-copy h1 {
          max-width: 820px;
        }

        .hero-copy p {
          margin-top: 24px;
        }

        .form-panel {
          justify-content: flex-start;
        }
      }

      @media (max-width: 640px) {
        .login-shell {
          min-height: 100svh;
          padding: 24px 16px;
        }

        .hero-copy h1 {
          font-size: clamp(42px, 14vw, 66px);
        }

        .hero-copy p {
          font-size: 18px;
        }

        .login-card {
          padding: 28px 20px;
          border-radius: 28px;
        }

        .eyebrow {
          font-size: 12px;
        }

        .form-control,
        .btn-primary {
          min-height: 56px;
        }

        .btn-primary {
          font-size: 19px;
        }

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
        this.notificationService.success('Bienvenido');
        this.redirectUser(response.mustChangePassword);
      },
      error: (error) => {
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

  private redirectUser(mustChangePassword = false): void {
    if (mustChangePassword || this.authService.mustChangePassword()) {
      this.router.navigate(['/change-password']);
      return;
    }

    // Redirigir según el rol del usuario
    if (this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/consolidados']);
    }
  }
}
