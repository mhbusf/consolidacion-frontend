import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CafeConJesusService } from '../../../core/services/cafe-con-jesus.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-cafe-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="form-card">
        <h2>Nuevo Ingreso - Cafe con Jesus</h2>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="nombre">Nombre *</label>
            <input
              type="text"
              id="nombre"
              formControlName="nombre"
              class="form-control"
              placeholder="Ej: Juan"
            />
            <div
              class="error"
              *ngIf="form.get('nombre')?.invalid && form.get('nombre')?.touched"
            >
              El nombre es requerido (minimo 2 caracteres)
            </div>
          </div>

          <div class="form-group">
            <label for="apellido">Apellido *</label>
            <input
              type="text"
              id="apellido"
              formControlName="apellido"
              class="form-control"
              placeholder="Ej: Perez"
            />
            <div
              class="error"
              *ngIf="
                form.get('apellido')?.invalid && form.get('apellido')?.touched
              "
            >
              El apellido es requerido (minimo 2 caracteres)
            </div>
          </div>

          <div class="form-group">
            <label for="telefono">Telefono *</label>
            <input
              type="tel"
              id="telefono"
              formControlName="telefono"
              class="form-control"
              placeholder="+56912345678"
            />
            <div
              class="error"
              *ngIf="
                form.get('telefono')?.invalid && form.get('telefono')?.touched
              "
            >
              El telefono es requerido
            </div>
          </div>

          <div class="form-group">
            <label for="invitadoPor">Invitado por</label>
            <input
              type="text"
              id="invitadoPor"
              formControlName="invitadoPor"
              class="form-control"
              placeholder="Nombre de quien lo invito"
            />
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="btn-secondary"
              (click)="cancelar()"
              [disabled]="isLoading"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="form.invalid || isLoading"
            >
              {{ isLoading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 600px;
        margin: 40px auto;
        padding: 20px;
      }

      .form-card {
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
        font-family: inherit;
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

      .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 30px;
      }

      .btn-primary,
      .btn-secondary {
        padding: 10px 24px;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-primary {
        background: var(--primary-light);
        color: white;
      }

      .btn-secondary {
        background: var(--secondary);
        color: white;
      }

      .btn-primary:hover:not(:disabled),
      .btn-secondary:hover:not(:disabled) {
        opacity: 0.9;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CafeCreateComponent {
  form: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private cafeService: CafeConJesusService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required]],
      invitadoPor: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.cafeService.crear(this.form.value).subscribe({
      next: () => {
        this.notificationService.success('Registro creado correctamente');
        this.router.navigate(['/cafe-con-jesus']);
      },
      error: (error) => {
        console.error('Error:', error);
        this.notificationService.error('Error al crear el registro');
        this.isLoading = false;
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/cafe-con-jesus']);
  }
}
