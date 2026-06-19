import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CafeConJesusService,
  CafeConJesusResponse,
  ETAPAS_CAFE,
  etapaLabel,
} from '../../../core/services/cafe-con-jesus.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-cafe-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h2>Cafe con Jesus</h2>
        <button class="btn-primary" (click)="nuevoRegistro()">
          + Nuevo Ingreso
        </button>
      </div>

      <div *ngIf="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Cargando registros...</p>
      </div>

      <div *ngIf="!isLoading && registros.length === 0" class="empty-state">
        <div class="empty-icon">☕</div>
        <h3>Sin registros</h3>
        <p>Aun no hay registros de Cafe con Jesus.</p>
        <button class="btn-primary" (click)="nuevoRegistro()">
          + Crear primer registro
        </button>
      </div>

      <div class="table-container" *ngIf="!isLoading && registros.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Telefono</th>
              <th>Edad</th>
              <th>Invitado por</th>
              <th>Tel. Invitado por</th>
              <th>Fecha Ingreso</th>
              <th>Asistio</th>
              <th>Fecha Asistencia</th>
              <th>Etapa</th>
              <th>Comentario</th>
              <th>Registrado por</th>
              <th>Asignado a</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of registros">
              <td class="fw-bold">{{ r.nombre }}</td>
              <td>{{ r.apellido }}</td>
              <td>{{ r.telefono }}</td>
              <td>{{ r.edad || '-' }}</td>
              <td>{{ r.invitadoPor || '-' }}</td>
              <td>{{ r.telefonoInvitadoPor || '-' }}</td>
              <td>{{ r.fechaIngreso | date : 'dd/MM/yyyy' }}</td>
              <td>
                <span class="badge" [class.badge-success]="r.asistio" [class.badge-pending]="!r.asistio">
                  {{ r.asistio ? 'Si' : 'No' }}
                </span>
              </td>
              <td>{{ r.fechaAsistencia ? (r.fechaAsistencia | date : 'dd/MM/yyyy') : '-' }}</td>
              <td>
                <span *ngIf="r.etapa" class="badge-etapa" [ngClass]="getEtapaClass(r.etapa)">{{ getEtapaLabel(r.etapa) }}</span>
                <span *ngIf="!r.etapa" class="text-muted-sm">—</span>
              </td>
              <td class="comentario-cell">{{ r.comentario || '-' }}</td>
              <td>
                <span class="user-badge">{{ r.registradoPor }}</span>
              </td>
              <td>
                <span class="user-badge badge-asignado" *ngIf="r.usuarioAsignado">{{ r.usuarioAsignado }}</span>
                <span *ngIf="!r.usuarioAsignado" class="badge badge-pending">Sin asignar</span>
              </td>
              <td class="actions-cell">
                <button class="btn-edit" (click)="editarRegistro(r)">Editar</button>
                <button class="btn-convertir" *ngIf="!r.convertidoAConsolidado" (click)="convertirAConsolidado(r)">
                  Acepto al Senor
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Modal editar -->
        <div class="modal-overlay" *ngIf="registroEditando" (click)="cancelarEdicion()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>Editar Registro</h3>
            <div class="form-group">
              <label>Consolidador asignado</label>
              <select [(ngModel)]="editUsuarioAsignado" class="form-control">
                <option value="">Sin asignar</option>
                <option *ngFor="let u of usuarios" [value]="u.username">{{ u.username }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Asistio al Cafe con Jesus</label>
              <select [(ngModel)]="editAsistio" class="form-control" (ngModelChange)="onAsistioChange()">
                <option [ngValue]="false">No</option>
                <option [ngValue]="true">Si</option>
              </select>
            </div>
            <div class="form-group" *ngIf="editAsistio">
              <label>Fecha de Asistencia</label>
              <input type="date" [(ngModel)]="editFechaAsistencia" class="form-control" />
            </div>
            <div class="form-group">
              <label>Etapa de seguimiento</label>
              <select [(ngModel)]="editEtapa" class="form-control">
                <option value="">— Sin etapa —</option>
                <option *ngFor="let e of etapas" [value]="e.value">{{ e.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Comentario</label>
              <textarea [(ngModel)]="editComentario" class="form-control" rows="3" placeholder="Agregar comentario..."></textarea>
            </div>
            <div class="modal-actions">
              <button class="btn-secondary" (click)="cancelarEdicion()">Cancelar</button>
              <button class="btn-primary" (click)="guardarEdicion()" [disabled]="isSaving">
                {{ isSaving ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 1600px;
        margin: 40px auto;
        padding: 20px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      h2 {
        color: var(--text-primary);
        font-size: 28px;
        font-weight: 700;
      }

      .btn-primary {
        background: var(--primary-light);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .table-container {
        background: var(--bg-card);
        border-radius: 12px;
        overflow-x: auto;
        border: 1px solid var(--border-color);
      }

      .data-table {
        width: 100%;
        min-width: 1600px;
        border-collapse: collapse;
      }

      .data-table thead {
        background: var(--bg-secondary);
      }

      .data-table th {
        padding: 14px 16px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        border-bottom: 1px solid var(--border-color);
      }

      .data-table td {
        padding: 14px 16px;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-color);
      }

      .data-table tbody tr {
        transition: background 0.2s;
      }

      .data-table tbody tr:hover {
        background: var(--bg-hover);
      }

      .data-table tbody tr:last-child td {
        border-bottom: none;
      }

      .fw-bold {
        font-weight: 600;
      }

      .user-badge {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px 20px;
        color: var(--text-secondary);
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--bg-secondary);
        border-top-color: var(--primary-light);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
      }

      .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .empty-state h3 {
        color: var(--text-primary);
        font-size: 22px;
        margin-bottom: 8px;
      }

      .empty-state p {
        color: var(--text-secondary);
        margin-bottom: 20px;
      }

      .badge {
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
      }

      .badge-success {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
      }

      .badge-pending {
        background: rgba(234, 179, 8, 0.15);
        color: #eab308;
      }

      .badge-asignado {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
      }

      .comentario-cell {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .badge-etapa {
        padding: 3px 10px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }

      .etapa-1 { background: rgba(59,130,246,0.15); color: #3b82f6; }
      .etapa-2 { background: rgba(99,102,241,0.15); color: #6366f1; }
      .etapa-3 { background: rgba(139,92,246,0.15); color: #8b5cf6; }
      .etapa-4 { background: rgba(34,197,94,0.15);  color: #22c55e; }
      .etapa-5 { background: rgba(107,114,128,0.15);color: #6b7280; }

      .text-muted-sm { color: var(--text-muted); font-size: 13px; }

      .btn-edit {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-edit:hover {
        opacity: 0.8;
      }

      .btn-convertir {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-convertir:hover {
        opacity: 0.8;
      }

      .actions-cell {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: var(--bg-card);
        padding: 30px;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        border: 1px solid var(--border-color);
      }

      .modal-content h3 {
        margin-bottom: 20px;
        color: var(--text-primary);
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        margin-bottom: 6px;
        color: var(--text-secondary);
        font-weight: 500;
        font-size: 14px;
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

      .form-control:focus {
        outline: none;
        border-color: var(--primary-light);
      }

      textarea.form-control {
        resize: vertical;
      }

      .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 24px;
      }

      .btn-primary, .btn-secondary {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-secondary {
        background: var(--secondary);
        color: white;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CafeListComponent implements OnInit {
  registros: CafeConJesusResponse[] = [];
  usuarios: User[] = [];
  isLoading = true;
  isAdmin = false;

  etapas = ETAPAS_CAFE;

  // Edicion
  registroEditando: CafeConJesusResponse | null = null;
  editAsistio = false;
  editFechaAsistencia = '';
  editComentario = '';
  editUsuarioAsignado = '';
  editEtapa = '';
  isSaving = false;

  constructor(
    private cafeService: CafeConJesusService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.cargarRegistros();
    if (this.isAdmin) {
      this.authService.getAllUsers().subscribe({
        next: (users) => { this.usuarios = users; },
        error: (error) => { console.error('Error al cargar usuarios', error); }
      });
    }
  }

  cargarRegistros(): void {
    this.isLoading = true;
    const obs$ = this.isAdmin
      ? this.cafeService.listarTodos()
      : this.cafeService.listarMios();

    obs$.subscribe({
      next: (data) => {
        this.registros = data.filter(r => !r.convertidoAConsolidado && !r.archivado);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar registros:', error);
        this.isLoading = false;
      },
    });
  }

  nuevoRegistro(): void {
    this.router.navigate(['/cafe-con-jesus/nuevo']);
  }

  editarRegistro(r: CafeConJesusResponse): void {
    this.registroEditando = r;
    this.editAsistio = r.asistio || false;
    this.editFechaAsistencia = r.fechaAsistencia || '';
    this.editComentario = r.comentario || '';
    this.editUsuarioAsignado = r.usuarioAsignado || '';
    this.editEtapa = r.etapa || '';
  }

  getEtapaLabel(value: string): string {
    return etapaLabel(value);
  }

  getEtapaClass(value: string): string {
    const idx = ETAPAS_CAFE.findIndex(e => e.value === value);
    return idx >= 0 ? `etapa-${idx + 1}` : '';
  }

  onAsistioChange(): void {
    if (!this.editAsistio) {
      this.editFechaAsistencia = '';
    }
  }

  cancelarEdicion(): void {
    this.registroEditando = null;
  }

  guardarEdicion(): void {
    if (!this.registroEditando) return;

    this.isSaving = true;
    const id = this.registroEditando.id;

    const request = {
      nombre: this.registroEditando.nombre,
      apellido: this.registroEditando.apellido,
      telefono: this.registroEditando.telefono,
      edad: this.registroEditando.edad,
      invitadoPor: this.registroEditando.invitadoPor,
      telefonoInvitadoPor: this.registroEditando.telefonoInvitadoPor,
      comentario: this.editComentario,
      asistio: this.editAsistio,
      fechaAsistencia: this.editAsistio ? this.editFechaAsistencia : undefined,
      etapa: this.editEtapa || undefined,
    };

    this.cafeService.actualizar(id, request).subscribe({
      next: () => {
        // Si cambió el usuario asignado, llamar al endpoint de asignación
        if (this.editUsuarioAsignado && this.editUsuarioAsignado !== this.registroEditando?.usuarioAsignado) {
          this.cafeService.asignarUsuario(id, this.editUsuarioAsignado).subscribe({
            next: () => {
              this.notificationService.success('Registro actualizado y asignado correctamente');
              this.registroEditando = null;
              this.isSaving = false;
              this.cargarRegistros();
            },
            error: (error) => {
              console.error('Error al asignar:', error);
              this.notificationService.error('Registro actualizado pero error al asignar');
              this.isSaving = false;
              this.cargarRegistros();
            },
          });
        } else {
          this.notificationService.success('Registro actualizado correctamente');
          this.registroEditando = null;
          this.isSaving = false;
          this.cargarRegistros();
        }
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
        this.notificationService.error('Error al actualizar el registro');
        this.isSaving = false;
      },
    });
  }

  convertirAConsolidado(r: CafeConJesusResponse): void {
    if (!confirm(`¿Confirmas que ${r.nombre} ${r.apellido} acepto al Senor? Se creara un registro en Consolidacion.`)) {
      return;
    }

    this.cafeService.convertirAConsolidado(r.id).subscribe({
      next: () => {
        this.notificationService.success('Registro convertido a consolidacion exitosamente');
        this.cargarRegistros();
      },
      error: (error) => {
        console.error('Error al convertir:', error);
        this.notificationService.error(error.error?.message || 'Error al convertir a consolidado');
      },
    });
  }
}
