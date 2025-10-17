import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
            <div class="error" *ngIf="userForm.get('username')?.invalid && userForm.get('username')?.touched">
              Usuario requerido (mínimo 3 caracteres)
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
            <div class="error" *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched">
              Email válido requerido
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña *</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-control"
              placeholder="Mínimo 6 caracteres">
            <div class="error" *ngIf="userForm.get('password')?.invalid && userForm.get('password')?.touched">
              Contraseña requerida (mínimo 6 caracteres)
            </div>
          </div>

          <div class="form-group">
            <label for="role">Rol *</label>
            <select id="role" formControlName="role" class="form-control">
              <option value="">Seleccione un rol</option>
              <option value="ROLE_USER">Usuario</option>
              <option value="ROLE_ADMIN">Administrador</option>
            </select>
            <div class="error" *ngIf="userForm.get('role')?.invalid && userForm.get('role')?.touched">
              Debe seleccionar un rol
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
              [disabled]="userForm.invalid || isLoading">
              {{ isLoading ? 'Creando...' : 'Crear Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 600px;
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
      font-size: 16px;
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

    const { username, email, password, role } = this.userForm.value;

    // Primero registrar el usuario
    this.authService.register({ username, email, password }).subscribe({
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