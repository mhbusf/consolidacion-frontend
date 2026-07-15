import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { ComunaService } from '../../../core/services/comuna.service';
import { ReunionService } from '../../../core/services/reunion.service'; // ← NUEVO
import { TelefonoChilenoValidator } from '../../../shared/validators/telefono-chileno.validator';
import { NotificationService } from '../../../core/services/notification.service';
import { Comuna, DuplicateValidationResponse, Reunion } from '../../../core/models/consolidado.model'; // ← AGREGAR Reunion

@Component({
  selector: 'app-consolidado-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="form-card">
        <h2>Nuevo Consolidado</h2>
    
        <form [formGroup]="consolidadoForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="nombre">Nombre Completo *</label>
            <input
              type="text"
              id="nombre"
              formControlName="nombre"
              class="form-control"
              placeholder="Ej: Juan Pérez"
              />
            @if (
              consolidadoForm.get('nombre')?.invalid &&
              consolidadoForm.get('nombre')?.touched
              ) {
              <div
                class="error"
                >
                El nombre es requerido (mínimo 3 caracteres)
              </div>
            }
          </div>
    
          <div class="form-row">
            <div class="form-group">
              <label for="telefono">Teléfono *</label>
              <input
                type="tel"
                id="telefono"
                formControlName="telefono"
                class="form-control"
                placeholder="+56912345678"
                />
              @if (
                consolidadoForm.get('telefono')?.invalid &&
                consolidadoForm.get('telefono')?.touched
                ) {
                <div
                  class="error"
                  >
                  @if (consolidadoForm.get('telefono')?.hasError('required')) {
                    <span
                      >
                      El teléfono es requerido
                    </span>
                  }
                  @if (
                    consolidadoForm
                    .get('telefono')
                    ?.hasError('telefonoInvalido')
                    ) {
                    <span
                      >
                      Formato inválido. Use: +56912345678 o 912345678
                    </span>
                  }
                </div>
              }
            </div>
    
            <div class="form-group">
              <label for="edad">Edad *</label>
              <input
                type="number"
                id="edad"
                formControlName="edad"
                class="form-control"
                placeholder="25"
                />
              @if (
                consolidadoForm.get('edad')?.invalid &&
                consolidadoForm.get('edad')?.touched
                ) {
                <div
                  class="error"
                  >
                  Edad debe ser entre 1 y 120 años
                </div>
              }
            </div>
          </div>
    
          <div class="form-group">
            <label for="comunaId">Comuna *</label>
            <select
              id="comunaId"
              formControlName="comunaId"
              class="form-control"
              [disabled]="isLoadingComunas"
              >
              <option [ngValue]="0">
                {{
                isLoadingComunas
                ? 'Cargando comunas...'
                : 'Seleccione una comuna'
                }}
              </option>
    
              @for (provincia of getProvincias(); track provincia) {
                <optgroup
                  [label]="provincia"
                  >
                  @for (comuna of getComunasPorProvincia(provincia); track comuna) {
                    <option
                      [ngValue]="comuna.id"
                      >
                      {{ comuna.nombre }}
                    </option>
                  }
                </optgroup>
              }
            </select>
    
            @if (
              consolidadoForm.get('comunaId')?.invalid &&
              consolidadoForm.get('comunaId')?.touched
              ) {
              <div
                class="error"
                >
                Debe seleccionar una comuna
              </div>
            }
          </div>
    
          <div class="form-group">
            <label for="reunionId">¿En qué culto/reunión llegó? *</label>
            <select
              id="reunionId"
              formControlName="reunionId"
              class="form-control"
              [disabled]="isLoadingReuniones"
              >
              <option [ngValue]="null">
                {{
                isLoadingReuniones
                ? 'Cargando reuniones...'
                : 'Seleccione un culto/reunión'
                }}
              </option>
              @for (reunion of reuniones; track reunion) {
                <option [ngValue]="reunion.id">
                  {{ reunion.nombre }}
                </option>
              }
            </select>
            @if (consolidadoForm.get('reunionId')?.invalid && consolidadoForm.get('reunionId')?.touched) {
              <div class="error">Debe seleccionar el culto/reunión donde llegó</div>
            }
          </div>
    
          <div class="form-group">
            <label for="quienInvito">¿Quién lo invitó? *</label>
            <input
              type="text"
              id="quienInvito"
              formControlName="quienInvito"
              class="form-control"
              placeholder="Ej: María González"
              />
            @if (
              consolidadoForm.get('quienInvito')?.invalid &&
              consolidadoForm.get('quienInvito')?.touched
              ) {
              <div
                class="error"
                >
                Este campo es requerido
              </div>
            }
          </div>
    
          <div class="form-group">
            <label for="motivoOracion">Motivo de Oración *</label>
            <textarea
              id="motivoOracion"
              formControlName="motivoOracion"
              class="form-control"
              rows="4"
              placeholder="Describe el motivo de oración o necesidad..."
            ></textarea>
            @if (
              consolidadoForm.get('motivoOracion')?.invalid &&
              consolidadoForm.get('motivoOracion')?.touched
              ) {
              <div
                class="error"
                >
                El motivo de oración es requerido (mínimo 10 caracteres)
              </div>
            }
          </div>
    
          @if (errorMessage) {
            <div class="error">
              {{ errorMessage }}
            </div>
          }

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
              [disabled]="consolidadoForm.invalid || isLoading"
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
        max-width: 800px;
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

      .form-row {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
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

      select.form-control {
        cursor: pointer;
      }

      select.form-control:disabled {
        background-color: var(--bg-primary);
        cursor: not-allowed;
        opacity: 0.7;
      }

      textarea.form-control {
        resize: vertical;
      }

      .form-text {
        display: block;
        margin-top: 5px;
        color: var(--text-muted);
        font-size: 12px;
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
export class ConsolidadoCreateComponent implements OnInit {
  consolidadoForm: FormGroup;
  isLoading = false;
  isLoadingComunas = true;
  isLoadingReuniones = true; // ← NUEVO
  errorMessage = '';
  duplicateWarning: DuplicateValidationResponse | null = null;
  comunas: Comuna[] = [];
  reuniones: Reunion[] = []; // ← NUEVO

  constructor(
    private fb: FormBuilder,
    private consolidadoService: ConsolidadoService,
    private comunaService: ComunaService,
    private reunionService: ReunionService, // ← NUEVO
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.consolidadoForm = this.fb.group({
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      telefono: ['', [Validators.required, TelefonoChilenoValidator.validar()]],
      edad: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      comunaId: [0, [Validators.required, Validators.min(1)]],
      reunionId: [null, [Validators.required]],
      quienInvito: ['', [Validators.required, Validators.maxLength(100)]],
      motivoOracion: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500),
        ],
      ],
    });
  }

  ngOnInit(): void {
    this.cargarComunas();
    this.cargarReuniones(); // ← NUEVO
  }

  cargarComunas(): void {
    this.comunaService.listarTodas().subscribe({
      next: (data) => {
        this.comunas = data;
        this.isLoadingComunas = false;
      },
      error: (error) => {
        console.error('Error al cargar comunas', error);
        this.notificationService.error('Error al cargar comunas');
        this.isLoadingComunas = false;
      },
    });
  }

  // ← NUEVO MÉTODO
  cargarReuniones(): void {
    this.reunionService.listar().subscribe({
      next: (data) => {
        this.reuniones = data;
        this.isLoadingReuniones = false;
      },
      error: (error) => {
        console.error('Error al cargar reuniones', error);
        this.notificationService.error('Error al cargar reuniones');
        this.isLoadingReuniones = false;
      },
    });
  }

  getProvincias(): string[] {
    const provincias = [...new Set(this.comunas.map((c) => c.provincia))];
    return provincias.sort();
  }

  getComunasPorProvincia(provincia: string): Comuna[] {
    return this.comunas.filter((c) => c.provincia === provincia);
  }

  onSubmit(): void {
    if (this.consolidadoForm.invalid) {
      this.consolidadoForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.duplicateWarning = null;

    const formValue = this.consolidadoForm.value;

    // Convertir valores a números y manejar reunionId opcional
    const requestPayload = {
      ...formValue,
      edad: Number(formValue.edad),
      comunaId: Number(formValue.comunaId),
      reunionId: Number(formValue.reunionId),
    };

    console.log('Enviando Payload:', requestPayload);

    this.consolidadoService.crear(requestPayload).subscribe({
      next: () => {
        this.notificationService.success('Consolidado creado correctamente');
        this.router.navigate(['/consolidados']);
      },
      error: (error) => {
        console.error('Error Backend:', error);
        if (error.status === 409 && error.error?.coincidencias) {
          this.duplicateWarning = error.error as DuplicateValidationResponse;
          this.notificationService.warning('Se encontraron posibles coincidencias');
          this.isLoading = false;
          return;
        }

        this.notificationService.error(
          'Error al crear el consolidado. Verifique los datos.'
        );
        this.isLoading = false;
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/consolidados']);
  }
}
