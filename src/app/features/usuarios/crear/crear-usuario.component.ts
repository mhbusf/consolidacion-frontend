import { Component, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="card">
        <h2>Crear Nuevo Usuario</h2>
    
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Usuario *</label>
            <input
              type="text"
              id="username"
              formControlName="username"
              class="form-control"
              placeholder="Nombre de usuario">
            @if (userForm.get('username')?.invalid && userForm.get('username')?.touched) {
              <div class="error">
                Usuario requerido (mínimo 3 caracteres)
              </div>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                formControlName="nombre"
                class="form-control"
                placeholder="Nombre de la persona">
              @if (userForm.get('nombre')?.invalid && userForm.get('nombre')?.touched) {
                <div class="error">
                  Nombre requerido
                </div>
              }
            </div>

            <div class="form-group">
              <label for="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                formControlName="apellido"
                class="form-control"
                placeholder="Apellido de la persona">
              @if (userForm.get('apellido')?.invalid && userForm.get('apellido')?.touched) {
                <div class="error">
                  Apellido requerido
                </div>
              }
            </div>
          </div>
     
          <div class="form-group">
            <label for="email">Email *</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-control"
              placeholder="usuario@ejemplo.com">
            @if (userForm.get('email')?.invalid && userForm.get('email')?.touched) {
              <div class="error">
                Email válido requerido
              </div>
            }
          </div>
    
          <div class="form-group">
            <label for="password">Contraseña *</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              placeholder="Mínimo 6 caracteres">
            @if (userForm.get('password')?.invalid && userForm.get('password')?.touched) {
              <div class="error">
                Contraseña requerida (mínimo 6 caracteres)
              </div>
            }
          </div>
    
          <div class="form-group">
            <label for="role">Rol *</label>
            <select id="role" formControlName="role" class="form-control">
              <option value="">Seleccione un rol</option>
              <option value="ROLE_USER">Usuario</option>
              <option value="ROLE_ADMIN">Administrador</option>
            </select>
            @if (userForm.get('role')?.invalid && userForm.get('role')?.touched) {
              <div class="error">
                Debe seleccionar un rol
              </div>
            }
          </div>
    
          @if (errorMessage) {
            <div class="error">
              {{ errorMessage }}
            </div>
          }
    
          @if (successMessage) {
            <div class="success">
              {{ successMessage }}
            </div>
          }
    
          <div class="actions">
            <button type="button" class="btn-secondary" (click)="cancelar()">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="userForm.invalid || isLoading">
              {{ isLoading ? 'Creando...' : 'Crear Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
    }

    .card {
      background: var(--bg-card);
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
    }

    h2 {
      margin-bottom: 30px;
      color: var(--text-primary);
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
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
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .error {
      color: var(--danger);
      font-size: 12px;
      margin-top: 5px;
    }

    .success {
      color: var(--success);
      padding: 10px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--success);
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
      font-size: 16px;
    }

    .btn-primary {
      background: var(--primary-light);
      color: white;
    }

    .btn-secondary {
      background: var(--secondary);
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .card {
        padding: 24px;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 0;
      }

      .actions {
        flex-direction: column-reverse;
      }
    }
  `]
})
export class CrearUsuarioComponent {
  userForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { username, nombre, apellido, email, password, role } = this.userForm.value;

    // Primero registrar el usuario
    this.authService.register({ username, nombre, apellido, email, password }).subscribe({
  next: () => {
    this.authService.assignRole(username, role).subscribe({
      next: () => {
        this.notificationService.success('Usuario creado correctamente');
        this.userForm.reset();
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/usuarios']);
        }, 2000);
      },
      error: () => {
        this.notificationService.warning('Usuario creado pero error al asignar rol');
        this.isLoading = false;
      }
    });
  },
  error: (error) => {
    this.notificationService.error('Error al crear usuario');
    this.isLoading = false;
  }
});
  }

  cancelar(): void {
    this.router.navigate(['/usuarios']);
  }
}
