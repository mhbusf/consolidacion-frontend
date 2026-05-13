import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CafeConJesusService,
  CafeAdminDashboard,
  CafeConJesusResponse,
} from '../../../core/services/cafe-con-jesus.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../core/models/auth.model';

type GrupoKey = 'sinAsignar' | 'asignados' | 'pasaronAConsolidacion' | 'archivados';

@Component({
  selector: 'app-cafe-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <div>
          <h2>Dashboard Café con Jesús</h2>
          <p class="subtitle">Gestión y asignación de registros</p>
        </div>
        <button class="btn-secondary" (click)="recargar()" [disabled]="isLoading">
          {{ isLoading ? 'Actualizando...' : 'Refrescar' }}
        </button>
      </div>

      <div *ngIf="isLoading && !dashboard" class="loading">
        <div class="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>

      <ng-container *ngIf="dashboard">
        <!-- Métricas -->
        <div class="metrics">
          <div class="metric-card">
            <div class="metric-label">Total registros</div>
            <div class="metric-value">{{ dashboard.totalRegistros }}</div>
          </div>
          <div class="metric-card metric-blue">
            <div class="metric-label">Asistieron</div>
            <div class="metric-value">{{ dashboard.totalAsistieron }}</div>
          </div>
          <div class="metric-card metric-green">
            <div class="metric-label">Aceptaron al Señor</div>
            <div class="metric-value">{{ dashboard.totalAceptaronAlSenor }}</div>
          </div>
          <div class="metric-card metric-purple">
            <div class="metric-label">% Conversión</div>
            <div class="metric-value">{{ dashboard.porcentajeConversion }}%</div>
          </div>
        </div>

        <!-- Grupos -->
        <div class="grupos">
          <div class="grupo" *ngFor="let g of grupos">
            <button
              class="grupo-header"
              [class.grupo-header-open]="grupoAbierto === g.key"
              [ngClass]="g.colorClass"
              (click)="toggleGrupo(g.key)"
            >
              <div class="grupo-icon">{{ g.icon }}</div>
              <div class="grupo-info">
                <div class="grupo-titulo">{{ g.titulo }}</div>
                <div class="grupo-descripcion">{{ g.descripcion }}</div>
              </div>
              <div class="grupo-count">
                {{ dashboard![g.totalKey] }}
              </div>
              <div class="grupo-arrow" [class.open]="grupoAbierto === g.key">▼</div>
            </button>

            <div class="grupo-body" *ngIf="grupoAbierto === g.key">
              <div *ngIf="dashboard![g.key].length === 0" class="empty-grupo">
                <p>No hay registros en este grupo.</p>
              </div>

              <div class="table-wrap" *ngIf="dashboard![g.key].length > 0">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Edad</th>
                      <th>Invitado por</th>
                      <th>Fecha ingreso</th>
                      <th>Asistió</th>
                      <th *ngIf="g.key !== 'pasaronAConsolidacion'">Asignado a</th>
                      <th *ngIf="g.key === 'pasaronAConsolidacion'">Consolidado</th>
                      <th *ngIf="g.key === 'archivados'">Fecha archivado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let r of dashboard![g.key]">
                      <td class="fw-bold">{{ r.nombre }} {{ r.apellido }}</td>
                      <td>{{ r.telefono }}</td>
                      <td>{{ r.edad || '-' }}</td>
                      <td>{{ r.invitadoPor || '-' }}</td>
                      <td>{{ r.fechaIngreso | date: 'dd/MM/yyyy' }}</td>
                      <td>
                        <span class="badge" [class.badge-success]="r.asistio" [class.badge-pending]="!r.asistio">
                          {{ r.asistio ? 'Sí' : 'No' }}
                        </span>
                      </td>
                      <td *ngIf="g.key !== 'pasaronAConsolidacion'">
                        <span class="user-badge badge-asignado" *ngIf="r.usuarioAsignado">{{ r.usuarioAsignado }}</span>
                        <span *ngIf="!r.usuarioAsignado" class="badge badge-pending">Sin asignar</span>
                      </td>
                      <td *ngIf="g.key === 'pasaronAConsolidacion'">
                        <a class="link" (click)="verConsolidado(r)">Ver #{{ r.consolidadoId }}</a>
                      </td>
                      <td *ngIf="g.key === 'archivados'">
                        {{ r.fechaArchivado ? (r.fechaArchivado | date: 'dd/MM/yyyy') : '-' }}
                      </td>
                      <td class="actions-cell">
                        <ng-container [ngSwitch]="g.key">
                          <ng-container *ngSwitchCase="'sinAsignar'">
                            <button class="btn-asignar" (click)="abrirAsignar(r)">Asignar</button>
                            <button class="btn-edit" (click)="abrirEditar(r)">Editar</button>
                            <button class="btn-warning" (click)="archivar(r)">Archivar</button>
                          </ng-container>
                          <ng-container *ngSwitchCase="'asignados'">
                            <button class="btn-asignar" (click)="abrirAsignar(r)">Reasignar</button>
                            <button class="btn-edit" (click)="abrirEditar(r)">Editar</button>
                            <button class="btn-convertir" (click)="convertir(r)">Aceptó al Señor</button>
                            <button class="btn-warning" (click)="archivar(r)">Archivar</button>
                          </ng-container>
                          <ng-container *ngSwitchCase="'pasaronAConsolidacion'">
                            <button class="btn-edit" (click)="verConsolidado(r)">Ver consolidado</button>
                          </ng-container>
                          <ng-container *ngSwitchCase="'archivados'">
                            <button class="btn-edit" (click)="desarchivar(r)">Desarchivar</button>
                          </ng-container>
                        </ng-container>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Modal asignar -->
      <div class="modal-overlay" *ngIf="registroAsignando" (click)="cerrarAsignar()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Asignar consolidador</h3>
          <p class="modal-sub">{{ registroAsignando.nombre }} {{ registroAsignando.apellido }}</p>
          <div class="form-group">
            <label>Consolidador</label>
            <select [(ngModel)]="asignarUsername" class="form-control">
              <option value="">Sin asignar</option>
              <option *ngFor="let u of usuarios" [value]="u.username">{{ u.username }}</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="cerrarAsignar()">Cancelar</button>
            <button class="btn-primary" (click)="confirmarAsignar()" [disabled]="!asignarUsername || isSaving">
              {{ isSaving ? 'Guardando...' : 'Asignar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal editar -->
      <div class="modal-overlay" *ngIf="registroEditando" (click)="cerrarEditar()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Editar registro</h3>
          <p class="modal-sub">{{ registroEditando.nombre }} {{ registroEditando.apellido }}</p>
          <div class="form-group">
            <label>Asistió al Café con Jesús</label>
            <select [(ngModel)]="editAsistio" class="form-control" (ngModelChange)="onAsistioChange()">
              <option [ngValue]="false">No</option>
              <option [ngValue]="true">Sí</option>
            </select>
          </div>
          <div class="form-group" *ngIf="editAsistio">
            <label>Fecha de asistencia</label>
            <input type="date" [(ngModel)]="editFechaAsistencia" class="form-control" />
          </div>
          <div class="form-group">
            <label>Comentario</label>
            <textarea [(ngModel)]="editComentario" class="form-control" rows="3" placeholder="Agregar comentario..."></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="cerrarEditar()">Cancelar</button>
            <button class="btn-primary" (click)="guardarEdicion()" [disabled]="isSaving">
              {{ isSaving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 1500px;
        margin: 32px auto;
        padding: 20px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
      }

      h2 {
        color: var(--text-primary);
        font-size: 28px;
        font-weight: 700;
      }

      .subtitle {
        color: var(--text-muted);
        font-size: 14px;
        margin-top: 4px;
      }

      .metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }

      .metric-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
      }

      .metric-blue { border-left: 4px solid #3b82f6; }
      .metric-green { border-left: 4px solid #22c55e; }
      .metric-purple { border-left: 4px solid #8b5cf6; }

      .metric-label {
        color: var(--text-muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .metric-value {
        color: var(--text-primary);
        font-size: 32px;
        font-weight: 700;
        margin-top: 8px;
      }

      .grupos {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .grupo {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        overflow: hidden;
      }

      .grupo-header {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 100%;
        padding: 18px 24px;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--text-primary);
        text-align: left;
        transition: background 0.2s;
      }

      .grupo-header:hover {
        background: var(--bg-hover);
      }

      .grupo-header-open {
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
      }

      .grupo-icon {
        font-size: 28px;
      }

      .grupo-info {
        flex: 1;
      }

      .grupo-titulo {
        font-size: 17px;
        font-weight: 700;
      }

      .grupo-descripcion {
        font-size: 13px;
        color: var(--text-muted);
        margin-top: 2px;
      }

      .grupo-count {
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 6px 14px;
        border-radius: 14px;
        font-weight: 700;
        font-size: 14px;
        min-width: 40px;
        text-align: center;
      }

      .grupo-arrow {
        font-size: 12px;
        color: var(--text-muted);
        transition: transform 0.2s;
      }

      .grupo-arrow.open {
        transform: rotate(180deg);
      }

      .header-color-yellow { border-left: 4px solid #eab308; }
      .header-color-blue { border-left: 4px solid #3b82f6; }
      .header-color-green { border-left: 4px solid #22c55e; }
      .header-color-gray { border-left: 4px solid #6b7280; }

      .grupo-body {
        padding: 16px 24px 24px;
      }

      .empty-grupo {
        padding: 24px;
        text-align: center;
        color: var(--text-muted);
      }

      .table-wrap {
        overflow-x: auto;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .data-table thead {
        background: var(--bg-secondary);
      }

      .data-table th {
        padding: 12px 14px;
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        border-bottom: 1px solid var(--border-color);
      }

      .data-table td {
        padding: 12px 14px;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-color);
        font-size: 14px;
      }

      .data-table tbody tr:hover {
        background: var(--bg-hover);
      }

      .data-table tbody tr:last-child td {
        border-bottom: none;
      }

      .fw-bold { font-weight: 600; }

      .badge {
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
      }

      .badge-success { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
      .badge-pending { background: rgba(234, 179, 8, 0.15); color: #eab308; }
      .badge-asignado { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }

      .user-badge {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
      }

      .actions-cell {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .btn-asignar,
      .btn-edit,
      .btn-convertir,
      .btn-warning {
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-asignar { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
      .btn-edit { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
      .btn-convertir { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
      .btn-warning { background: rgba(234, 88, 12, 0.15); color: #ea580c; }

      .btn-asignar:hover,
      .btn-edit:hover,
      .btn-convertir:hover,
      .btn-warning:hover { opacity: 0.8; }

      .link {
        color: #3b82f6;
        cursor: pointer;
        text-decoration: underline;
        font-weight: 600;
        font-size: 13px;
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
        to { transform: rotate(360deg); }
      }

      .modal-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: var(--bg-card);
        padding: 28px;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        border: 1px solid var(--border-color);
      }

      .modal-content h3 {
        margin-bottom: 6px;
        color: var(--text-primary);
      }

      .modal-sub {
        color: var(--text-muted);
        font-size: 13px;
        margin-bottom: 16px;
      }

      .form-group { margin-bottom: 16px; }

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

      textarea.form-control { resize: vertical; }

      .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 22px;
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

      .btn-primary {
        background: var(--primary-light);
        color: white;
      }

      .btn-secondary {
        background: var(--secondary);
        color: white;
      }

      .btn-primary:hover, .btn-secondary:hover { opacity: 0.9; }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CafeAdminDashboardComponent implements OnInit {
  dashboard: CafeAdminDashboard | null = null;
  isLoading = false;
  isSaving = false;
  usuarios: User[] = [];
  grupoAbierto: GrupoKey | null = 'sinAsignar';

  grupos: Array<{
    key: GrupoKey;
    titulo: string;
    descripcion: string;
    icon: string;
    colorClass: string;
    totalKey: 'totalSinAsignar' | 'totalAsignados' | 'totalPasaronAConsolidacion' | 'totalArchivados';
  }> = [
    {
      key: 'sinAsignar',
      titulo: 'Sin asignar',
      descripcion: 'Registros que aún no tienen consolidador asignado',
      icon: '⏳',
      colorClass: 'header-color-yellow',
      totalKey: 'totalSinAsignar',
    },
    {
      key: 'asignados',
      titulo: 'Asignados',
      descripcion: 'Registros en seguimiento con un consolidador',
      icon: '👥',
      colorClass: 'header-color-blue',
      totalKey: 'totalAsignados',
    },
    {
      key: 'pasaronAConsolidacion',
      titulo: 'Pasaron a consolidación',
      descripcion: 'Aceptaron al Señor y fueron convertidos',
      icon: '✅',
      colorClass: 'header-color-green',
      totalKey: 'totalPasaronAConsolidacion',
    },
    {
      key: 'archivados',
      titulo: 'Archivados',
      descripcion: 'Asistieron pero no aceptaron — guardados para futuro',
      icon: '📦',
      colorClass: 'header-color-gray',
      totalKey: 'totalArchivados',
    },
  ];

  registroAsignando: CafeConJesusResponse | null = null;
  asignarUsername = '';

  registroEditando: CafeConJesusResponse | null = null;
  editAsistio = false;
  editFechaAsistencia = '';
  editComentario = '';

  constructor(
    private cafeService: CafeConJesusService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
    this.authService.getAllUsers().subscribe({
      next: (users) => { this.usuarios = users; },
      error: (e) => console.error('Error al cargar usuarios', e),
    });
  }

  cargarDashboard(): void {
    this.isLoading = true;
    this.cafeService.obtenerDashboardAdmin().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.isLoading = false;
      },
      error: (e) => {
        console.error('Error al cargar dashboard', e);
        this.notificationService.error('Error al cargar el dashboard');
        this.isLoading = false;
      },
    });
  }

  recargar(): void {
    this.cargarDashboard();
  }

  toggleGrupo(key: GrupoKey): void {
    this.grupoAbierto = this.grupoAbierto === key ? null : key;
  }

  abrirAsignar(r: CafeConJesusResponse): void {
    this.registroAsignando = r;
    this.asignarUsername = r.usuarioAsignado || '';
  }

  cerrarAsignar(): void {
    this.registroAsignando = null;
    this.asignarUsername = '';
  }

  confirmarAsignar(): void {
    if (!this.registroAsignando || !this.asignarUsername) return;
    this.isSaving = true;
    this.cafeService.asignarUsuario(this.registroAsignando.id, this.asignarUsername).subscribe({
      next: () => {
        this.notificationService.success('Asignación realizada correctamente');
        this.isSaving = false;
        this.cerrarAsignar();
        this.cargarDashboard();
      },
      error: (e) => {
        console.error('Error al asignar', e);
        this.notificationService.error('Error al asignar');
        this.isSaving = false;
      },
    });
  }

  abrirEditar(r: CafeConJesusResponse): void {
    this.registroEditando = r;
    this.editAsistio = r.asistio || false;
    this.editFechaAsistencia = r.fechaAsistencia || '';
    this.editComentario = r.comentario || '';
  }

  cerrarEditar(): void {
    this.registroEditando = null;
  }

  onAsistioChange(): void {
    if (!this.editAsistio) {
      this.editFechaAsistencia = '';
    }
  }

  guardarEdicion(): void {
    if (!this.registroEditando) return;
    this.isSaving = true;
    const r = this.registroEditando;
    this.cafeService.actualizar(r.id, {
      nombre: r.nombre,
      apellido: r.apellido,
      telefono: r.telefono,
      edad: r.edad,
      invitadoPor: r.invitadoPor,
      telefonoInvitadoPor: r.telefonoInvitadoPor,
      comentario: this.editComentario,
      asistio: this.editAsistio,
      fechaAsistencia: this.editAsistio ? this.editFechaAsistencia : undefined,
    }).subscribe({
      next: () => {
        this.notificationService.success('Registro actualizado');
        this.isSaving = false;
        this.cerrarEditar();
        this.cargarDashboard();
      },
      error: (e) => {
        console.error('Error al actualizar', e);
        this.notificationService.error('Error al actualizar');
        this.isSaving = false;
      },
    });
  }

  convertir(r: CafeConJesusResponse): void {
    if (!confirm(`¿Confirmas que ${r.nombre} ${r.apellido} aceptó al Señor? Se creará un registro en Consolidación.`)) {
      return;
    }
    this.cafeService.convertirAConsolidado(r.id).subscribe({
      next: () => {
        this.notificationService.success('Convertido a consolidación');
        this.cargarDashboard();
      },
      error: (e) => {
        console.error('Error al convertir', e);
        this.notificationService.error(e.error?.message || 'Error al convertir');
      },
    });
  }

  archivar(r: CafeConJesusResponse): void {
    if (!confirm(`¿Archivar a ${r.nombre} ${r.apellido}? Quedará guardado por si se necesita revisar después.`)) {
      return;
    }
    this.cafeService.archivar(r.id).subscribe({
      next: () => {
        this.notificationService.success('Registro archivado');
        this.cargarDashboard();
      },
      error: (e) => {
        console.error('Error al archivar', e);
        this.notificationService.error('Error al archivar');
      },
    });
  }

  desarchivar(r: CafeConJesusResponse): void {
    this.cafeService.desarchivar(r.id).subscribe({
      next: () => {
        this.notificationService.success('Registro desarchivado');
        this.cargarDashboard();
      },
      error: (e) => {
        console.error('Error al desarchivar', e);
        this.notificationService.error('Error al desarchivar');
      },
    });
  }

  verConsolidado(r: CafeConJesusResponse): void {
    if (r.consolidadoId) {
      this.router.navigate(['/consolidados', r.consolidadoId]);
    }
  }
}
