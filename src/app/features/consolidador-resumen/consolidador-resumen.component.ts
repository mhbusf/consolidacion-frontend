import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService, ConsolidadorResumen } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-consolidador-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <div>
          <h2>Resumen por Consolidador</h2>
          <p class="subtitle">Selecciona un consolidador para ver su cartera completa</p>
        </div>
      </div>

      <!-- Selector -->
      <div class="selector-card">
        <label class="selector-label">Consolidador</label>
        <div class="selector-row">
          <select [(ngModel)]="usernameSeleccionado" class="form-control" (ngModelChange)="onSeleccionar()">
            <option value="">-- Selecciona un consolidador --</option>
            <option *ngFor="let u of usuarios" [value]="u.username">{{ u.username }}</option>
          </select>
          <div class="spinner-inline" *ngIf="isLoading"></div>
        </div>
      </div>

      <!-- Sin seleccionar -->
      <div *ngIf="!usernameSeleccionado && !isLoading" class="empty-state">
        <div class="empty-icon">👤</div>
        <p>Selecciona un consolidador para ver su información</p>
      </div>

      <!-- Resumen cargado -->
      <ng-container *ngIf="resumen && !isLoading">

        <!-- Métricas -->
        <div class="metrics">
          <div class="metric-card metric-blue">
            <div class="metric-label">Café con Jesús asignados</div>
            <div class="metric-value">{{ resumen.totalCafes }}</div>
          </div>
          <div class="metric-card metric-green">
            <div class="metric-label">Consolidados asignados</div>
            <div class="metric-value">{{ resumen.totalConsolidados }}</div>
          </div>
          <div class="metric-card metric-purple">
            <div class="metric-label">Total personas</div>
            <div class="metric-value">{{ resumen.totalCafes + resumen.totalConsolidados }}</div>
          </div>
        </div>

        <!-- Sección Café con Jesús -->
        <div class="seccion">
          <div class="seccion-header seccion-cafe">
            <span class="seccion-icon">☕</span>
            <span class="seccion-titulo">Café con Jesús</span>
            <span class="seccion-count">{{ resumen.totalCafes }}</span>
          </div>

          <div *ngIf="resumen.cafes.length === 0" class="seccion-empty">
            No tiene personas asignadas en Café con Jesús
          </div>

          <div class="table-wrap" *ngIf="resumen.cafes.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Edad</th>
                  <th>Invitado por</th>
                  <th>Fecha ingreso</th>
                  <th>Asistió</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of resumen.cafes">
                  <td class="fw-bold">{{ c.nombre }} {{ c.apellido }}</td>
                  <td>{{ c.telefono }}</td>
                  <td>{{ c.edad || '-' }}</td>
                  <td>{{ c.invitadoPor || '-' }}</td>
                  <td>{{ c.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="c.asistio" [class.badge-pending]="!c.asistio">
                      {{ c.asistio ? 'Sí' : 'No' }}
                    </span>
                  </td>
                  <td class="comentario-cell">{{ c.comentario || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sección Consolidados -->
        <div class="seccion">
          <div class="seccion-header seccion-consolidados">
            <span class="seccion-icon">👥</span>
            <span class="seccion-titulo">Consolidados</span>
            <span class="seccion-count">{{ resumen.totalConsolidados }}</span>
          </div>

          <div *ngIf="resumen.consolidados.length === 0" class="seccion-empty">
            No tiene personas asignadas en Consolidados
          </div>

          <div class="table-wrap" *ngIf="resumen.consolidados.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Edad</th>
                  <th>Quién invitó</th>
                  <th>Fecha ingreso</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of resumen.consolidados">
                  <td class="fw-bold">{{ c.nombre }}</td>
                  <td>{{ c.telefono }}</td>
                  <td>{{ c.edad || '-' }}</td>
                  <td>{{ c.quienInvito || '-' }}</td>
                  <td>{{ c.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <span class="badge" [ngClass]="getBadgeEstado(c.estado)">
                      {{ getLabelEstado(c.estado) }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-ver" (click)="verConsolidado(c.id)">Ver</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1400px;
      margin: 32px auto;
      padding: 20px;
    }

    .header {
      margin-bottom: 24px;
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

    .selector-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 28px;
    }

    .selector-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .selector-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .form-control {
      width: 100%;
      max-width: 400px;
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      cursor: pointer;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-light);
    }

    .spinner-inline {
      width: 22px;
      height: 22px;
      border: 3px solid var(--bg-secondary);
      border-top-color: var(--primary-light);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 56px;
      margin-bottom: 12px;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }

    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
    }

    .metric-blue  { border-left: 4px solid #3b82f6; }
    .metric-green { border-left: 4px solid #22c55e; }
    .metric-purple{ border-left: 4px solid #8b5cf6; }

    .metric-label {
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .metric-value {
      color: var(--text-primary);
      font-size: 36px;
      font-weight: 700;
      margin-top: 8px;
    }

    .seccion {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 20px;
    }

    .seccion-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .seccion-cafe        { background: rgba(234, 179, 8, 0.08);  border-left: 4px solid #eab308; }
    .seccion-consolidados{ background: rgba(59, 130, 246, 0.08); border-left: 4px solid #3b82f6; }

    .seccion-icon { font-size: 22px; }

    .seccion-titulo {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      flex: 1;
    }

    .seccion-count {
      background: var(--bg-secondary);
      color: var(--text-primary);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
    }

    .seccion-empty {
      padding: 32px;
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
    }

    .table-wrap {
      overflow-x: auto;
      padding: 0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead { background: var(--bg-secondary); }

    .data-table th {
      padding: 11px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
    }

    .data-table td {
      padding: 12px 16px;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-color);
      font-size: 14px;
    }

    .data-table tbody tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: var(--bg-hover); }

    .fw-bold { font-weight: 600; }

    .comentario-cell {
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-success  { background: rgba(34, 197, 94, 0.15);  color: #22c55e; }
    .badge-pending  { background: rgba(234, 179, 8, 0.15);  color: #eab308; }
    .badge-blue     { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .badge-purple   { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
    .badge-gray     { background: rgba(107, 114, 128, 0.15);color: #6b7280; }

    .btn-ver {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border: none;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-ver:hover { opacity: 0.8; }
  `]
})
export class ConsolidadorResumenComponent implements OnInit {
  usuarios: User[] = [];
  usernameSeleccionado = '';
  resumen: ConsolidadorResumen | null = null;
  isLoading = false;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => { this.usuarios = users; },
      error: () => this.notificationService.error('Error al cargar usuarios')
    });
  }

  onSeleccionar(): void {
    if (!this.usernameSeleccionado) {
      this.resumen = null;
      return;
    }
    this.isLoading = true;
    this.resumen = null;
    this.dashboardService.getResumenConsolidador(this.usernameSeleccionado).subscribe({
      next: (data) => {
        this.resumen = data;
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Error al cargar el resumen');
        this.isLoading = false;
      }
    });
  }

  getBadgeEstado(estado: string): string {
    const map: Record<string, string> = {
      ASIGNADO: 'badge-blue',
      EN_PROCESO: 'badge-pending',
      PENDIENTE: 'badge-pending',
      GDC: 'badge-purple',
      CERRADO: 'badge-gray'
    };
    return map[estado] || 'badge-gray';
  }

  getLabelEstado(estado: string): string {
    const map: Record<string, string> = {
      ASIGNADO: 'Asignado',
      EN_PROCESO: 'En proceso',
      PENDIENTE: 'Pendiente',
      GDC: 'En GDC',
      CERRADO: 'Cerrado'
    };
    return map[estado] || estado;
  }

  verConsolidado(id: number): void {
    this.router.navigate(['/consolidados', id]);
  }
}
