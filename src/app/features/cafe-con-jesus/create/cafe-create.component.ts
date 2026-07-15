import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CafeConJesusService } from '../../../core/services/cafe-con-jesus.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DuplicateValidationResponse, Reunion } from '../../../core/models/consolidado.model';
import { ReunionService } from '../../../core/services/reunion.service';

@Component({
  selector: 'app-cafe-create',
  standalone: true,
  imports: [ReactiveFormsModule],
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
            @if (form.get('nombre')?.invalid && form.get('nombre')?.touched) {
              <div
                class="error"
                >
                El nombre es requerido (minimo 2 caracteres)
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
              placeholder="Ej: Perez"
              />
            @if (
              form.get('apellido')?.invalid && form.get('apellido')?.touched
              ) {
              <div
                class="error"
                >
                El apellido es requerido (minimo 2 caracteres)
              </div>
            }
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
            @if (
              form.get('telefono')?.invalid && form.get('telefono')?.touched
              ) {
              <div
                class="error"
                >
                El telefono es requerido
              </div>
            }
          </div>
    
          <div class="form-group">
            <label for="edad">Edad</label>
            <input
              type="text"
              id="edad"
              formControlName="edad"
              class="form-control"
              placeholder="Ej: 25"
              />
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
    
          <div class="form-group">
            <label for="telefonoInvitadoPor">Telefono de quien invito</label>
            <input
              type="tel"
              id="telefonoInvitadoPor"
              formControlName="telefonoInvitadoPor"
              class="form-control"
              placeholder="+56912345678"
              />
          </div>

          <div class="form-group">
            <label for="reunionId">¿En qué culto/reunión llegó? *</label>
            <select id="reunionId" formControlName="reunionId" class="form-control" [disabled]="isLoadingReuniones">
              <option [ngValue]="null">
                {{ isLoadingReuniones ? 'Cargando cultos...' : 'Seleccione un culto/reunión' }}
              </option>
              @for (reunion of reuniones; track reunion.id) {
                <option [ngValue]="reunion.id">{{ reunion.nombre }}</option>
              }
            </select>
            @if (form.get('reunionId')?.invalid && form.get('reunionId')?.touched) {
              <div class="error">Debe seleccionar el culto/reunión donde llegó</div>
            }
          </div>

          @if (duplicateWarning) {
            <div class="duplicate-alert">
              <strong>{{ duplicateWarning.message }}</strong>
              <p>Revise antes de continuar. No se guardó el registro.</p>
              <ul>
                @for (item of duplicateWarning.coincidencias; track item.origen + item.id) {
                  <li>
                    <span class="duplicate-source">{{ item.origen }}</span>
                    <span>{{ item.nombre }}</span>
                    <span>Tel: {{ item.telefono || '—' }}</span>
                    <span>{{ item.estado || '—' }}</span>
                    <span>{{ item.detalle || '—' }}</span>
                    <span class="duplicate-match">Coincidencia: {{ item.coincidencia }}</span>
                  </li>
                }
              </ul>
            </div>
          }
     
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
  changeDetection: ChangeDetectionStrategy.Eager,
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

      .duplicate-alert {
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid rgba(245, 158, 11, 0.55);
        border-radius: 12px;
        color: var(--text-primary);
        padding: 16px;
        margin: 20px 0;
      }

      .duplicate-alert p {
        color: var(--text-secondary);
        margin: 4px 0 12px;
      }

      .duplicate-alert ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 8px;
      }

      .duplicate-alert li {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        align-items: center;
        background: rgba(15, 23, 42, 0.45);
        border-radius: 10px;
        padding: 10px;
        font-size: 13px;
      }

      .duplicate-source,
      .duplicate-match {
        font-weight: 700;
        color: var(--warning);
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
export class CafeCreateComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isLoadingReuniones = true;
  reuniones: Reunion[] = [];
  duplicateWarning: DuplicateValidationResponse | null = null;

  constructor(
    private fb: FormBuilder,
    private cafeService: CafeConJesusService,
    private reunionService: ReunionService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required]],
      edad: [''],
      invitadoPor: [''],
      telefonoInvitadoPor: [''],
      reunionId: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.reunionService.listar().subscribe({
      next: (data) => {
        this.reuniones = data;
        this.isLoadingReuniones = false;
      },
      error: () => {
        this.notificationService.error('Error al cargar cultos/reuniones');
        this.isLoadingReuniones = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.duplicateWarning = null;

    const payload = {
      ...this.form.value,
      reunionId: Number(this.form.value.reunionId),
    };

    this.cafeService.crear(payload).subscribe({
      next: () => {
        this.notificationService.success('Registro creado correctamente');
        this.router.navigate(['/cafe-con-jesus']);
      },
      error: (error) => {
        console.error('Error:', error);
        if (error.status === 409 && error.error?.coincidencias) {
          this.duplicateWarning = error.error as DuplicateValidationResponse;
          this.notificationService.warning('Se encontraron posibles coincidencias');
          this.isLoading = false;
          return;
        }

        this.notificationService.error('Error al crear el registro');
        this.isLoading = false;
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/cafe-con-jesus']);
  }
}
