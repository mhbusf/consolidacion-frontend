import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { TelefonoChilenoValidator } from '../../../shared/validators/telefono-chileno.validator';

@Component({
  selector: 'app-consolidado-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
              placeholder="Ej: Juan Pérez">
            <div class="error" *ngIf="consolidadoForm.get('nombre')?.invalid && consolidadoForm.get('nombre')?.touched">
              El nombre es requerido (mínimo 3 caracteres)
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="telefono">Teléfono *</label>
              <input 
                type="tel" 
                id="telefono" 
                formControlName="telefono" 
                class="form-control"
                placeholder="+56912345678">
              <div class="error" *ngIf="consolidadoForm.get('telefono')?.invalid && consolidadoForm.get('telefono')?.touched">
  <span *ngIf="consolidadoForm.get('telefono')?.hasError('required')">
    El teléfono es requerido
  </span>
  <span *ngIf="consolidadoForm.get('telefono')?.hasError('telefonoInvalido')">
    Formato inválido. Use: +56912345678 o 912345678
  </span>
</div>
            </div>

            <div class="form-group">
              <label for="edad">Edad *</label>
              <input 
                type="number" 
                id="edad" 
                formControlName="edad" 
                class="form-control"
                placeholder="25">
              <div class="error" *ngIf="consolidadoForm.get('edad')?.invalid && consolidadoForm.get('edad')?.touched">
                Edad debe ser entre 1 y 120 años
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="quienInvito">¿Quién lo invitó? *</label>
            <input 
              type="text" 
              id="quienInvito" 
              formControlName="quienInvito" 
              class="form-control"
              placeholder="Ej: María González">
            <div class="error" *ngIf="consolidadoForm.get('quienInvito')?.invalid && consolidadoForm.get('quienInvito')?.touched">
              Este campo es requerido
            </div>
          </div>

          <div class="form-group">
            <label for="motivoOracion">Motivo de Oración *</label>
            <textarea 
              id="motivoOracion" 
              formControlName="motivoOracion" 
              class="form-control"
              rows="4"
              placeholder="Describe el motivo de oración o necesidad..."></textarea>
            <div class="error" *ngIf="consolidadoForm.get('motivoOracion')?.invalid && consolidadoForm.get('motivoOracion')?.touched">
              El motivo de oración es requerido (mínimo 10 caracteres)
            </div>
          </div>

          <div class="error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="cancelar()" [disabled]="isLoading">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" [disabled]="consolidadoForm.invalid || isLoading">
              {{ isLoading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
    }

    .form-card {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    h2 {
      margin-bottom: 30px;
      color: #333;
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
      color: #555;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
    }

    textarea.form-control {
      resize: vertical;
    }

    .error {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 30px;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 24px;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
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
  `]
})
export class ConsolidadoCreateComponent {
  consolidadoForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private consolidadoService: ConsolidadoService,
    private router: Router
  ) {
    this.consolidadoForm = this.fb.group({
  nombre: ['', [
    Validators.required, 
    Validators.minLength(3),
    Validators.maxLength(100)
  ]],
  telefono: ['', [
    Validators.required,
    TelefonoChilenoValidator.validar()
  ]],
  edad: ['', [
    Validators.required, 
    Validators.min(1), 
    Validators.max(120)
  ]],
  quienInvito: ['', [
    Validators.required,
    Validators.maxLength(100)
  ]],
  motivoOracion: ['', [
    Validators.required, 
    Validators.minLength(10),
    Validators.maxLength(500)
  ]]
});
  }

  onSubmit(): void {
    if (this.consolidadoForm.invalid) {
      this.consolidadoForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.consolidadoService.crear(this.consolidadoForm.value).subscribe({
      next: () => {
        this.router.navigate(['/consolidados']);
      },
      error: (error) => {
        this.errorMessage = 'Error al crear el consolidado';
        this.isLoading = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/consolidados']);
  }
}