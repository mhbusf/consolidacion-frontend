import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../core/services/dashboard.service';
import { Dashboard } from '../core/models/consolidado.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1 class="dashboard-title">
        <span class="title-icon">📊</span>
        Dashboard de Seguimiento
      </h1>

      <!-- SOLO MOSTRAR SI HAY DATOS -->
      <ng-container *ngIf="dashboard">
        <div class="stats-grid">
          <!-- Total Consolidados -->
          <div class="stat-card stat-total" (click)="verConsolidados()">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboard.totalConsolidados }}</div>
              <div class="stat-label">Total Consolidados</div>
            </div>
          </div>

          <!-- En Proceso -->
          <div class="stat-card stat-process" (click)="verConsolidados()">
            <div class="stat-icon">🔄</div>
            <div class="stat-content">
              <div class="stat-value">
                {{ dashboard.consolidadosEnProceso }}
              </div>
              <div class="stat-label">En Proceso</div>
            </div>
          </div>

          <!-- Al Día -->
          <div class="stat-card stat-success">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboard.consolidadosAlDia }}</div>
              <div class="stat-label">Al Día</div>
            </div>
          </div>

          <!-- Con Atrasos -->
          <div class="stat-card stat-warning">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <div class="stat-value">
                {{ dashboard.consolidadosAtrasados }}
              </div>
              <div class="stat-label">Con Atrasos</div>
            </div>
          </div>

          <!-- Con GDC -->
          <div class="stat-card stat-info">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboard.consolidadosConGDC }}</div>
              <div class="stat-label">Con GDC Asignado</div>
            </div>
          </div>

          <!-- Cerrados -->
          <div class="stat-card stat-closed">
            <div class="stat-icon">🔒</div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboard.consolidadosCerrados }}</div>
              <div class="stat-label">Cerrados</div>
            </div>
          </div>
        </div>

        <!-- Estadísticas por Usuario -->
        <div class="section" *ngIf="dashboard.estadisticasPorUsuario?.length">
          <h2 class="section-title">📈 Estadísticas por Usuario</h2>
          <div class="table-container">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th class="text-center">Total Asignados</th>
                  <th class="text-center">Al Día</th>
                  <th class="text-center">Con Atrasos</th>
                  <th>Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let stat of dashboard.estadisticasPorUsuario">
                  <td class="user-cell">
                    <span class="user-avatar">{{
                      getInitials(stat.username)
                    }}</span>
                    <span class="user-name">{{ stat.username }}</span>
                  </td>
                  <td class="email-cell">{{ stat.email }}</td>
                  <td class="number-cell">{{ stat.totalAsignados }}</td>
                  <td class="number-cell success-text">{{ stat.alDia }}</td>
                  <td class="number-cell warning-text">
                    {{ stat.conAtrasos }}
                  </td>
                  <td class="progress-cell">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        [style.width.%]="
                          calcularPorcentaje(stat.alDia, stat.totalAsignados)
                        "
                        [ngClass]="{
                          high:
                            calcularPorcentaje(
                              stat.alDia,
                              stat.totalAsignados
                            ) >= 80,
                          medium:
                            calcularPorcentaje(
                              stat.alDia,
                              stat.totalAsignados
                            ) >= 50 &&
                            calcularPorcentaje(
                              stat.alDia,
                              stat.totalAsignados
                            ) < 80,
                          low:
                            calcularPorcentaje(
                              stat.alDia,
                              stat.totalAsignados
                            ) < 50
                        }"
                      ></div>
                    </div>
                    <span class="progress-text"
                      >{{
                        calcularPorcentaje(stat.alDia, stat.totalAsignados)
                      }}%</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Consolidados con Atrasos -->
        <div class="section" *ngIf="dashboard.consolidadosConAtrasos?.length">
          <h2 class="section-title">
            ⚠️ Consolidados con Atrasos ({{
              dashboard.consolidadosConAtrasos.length
            }})
          </h2>
          <div class="atrasos-grid">
            <div
              class="atraso-card"
              *ngFor="let consolidado of dashboard.consolidadosConAtrasos"
              (click)="verDetalle(consolidado.id)"
            >
              <div class="atraso-header">
                <h3>{{ consolidado.titulo }}</h3>
                <span
                  class="atraso-badge"
                  [ngClass]="{
                    'badge-critical': consolidado.diasDeAtraso > 5,
                    'badge-high':
                      consolidado.diasDeAtraso > 2 &&
                      consolidado.diasDeAtraso <= 5,
                    'badge-medium': consolidado.diasDeAtraso <= 2
                  }"
                >
                  {{ consolidado.diasDeAtraso }} día{{
                    consolidado.diasDeAtraso !== 1 ? 's' : ''
                  }}
                </span>
              </div>
              <div class="atraso-info">
                <div class="info-row">
                  <span class="info-label">👤 Asignado a:</span>
                  <span class="info-value">{{ consolidado.asignadoA }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">📅 Fecha ingreso:</span>
                  <span class="info-value">{{
                    consolidado.fechaIngreso | date : 'dd/MM/yyyy'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">📊 Estado:</span>
                  <span
                    class="badge"
                    [ngClass]="getBadgeClass(consolidado.estado)"
                  >
                    {{ getEstadoLabel(consolidado.estado) }}
                  </span>
                </div>
              </div>
              <div
                class="pendientes-list"
                *ngIf="consolidado.comentariosPendientes?.length"
              >
                <div class="pendientes-header">Comentarios Pendientes:</div>
                <div
                  class="pendiente-item"
                  *ngFor="let pendiente of consolidado.comentariosPendientes"
                >
                  <span class="pendiente-tipo">{{ pendiente.tipo }}</span>
                  <span class="pendiente-atraso"
                    >{{ pendiente.diasDeAtraso }} día{{
                      pendiente.diasDeAtraso !== 1 ? 's' : ''
                    }}</span
                  >
                </div>
              </div>
              <div class="card-footer">
                <span class="view-link">Ver detalle →</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Mensaje cuando todo está al día -->
        <div
          class="success-state"
          *ngIf="!dashboard.consolidadosConAtrasos?.length"
        >
          <div class="success-icon">🎉</div>
          <h3>¡Excelente trabajo!</h3>
          <p>No hay consolidados con atrasos en este momento.</p>
        </div>
      </ng-container>

      <!-- Estado de carga -->
      <div class="loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>

      <!-- Mensaje cuando no hay datos -->
      <div class="empty-state" *ngIf="!isLoading && !dashboard">
        <div class="empty-icon">📊</div>
        <h3>Sin datos disponibles</h3>
        <p>No se pudo cargar la información del dashboard.</p>
        <button class="btn-retry" (click)="cargarDashboard()">
          🔄 Reintentar
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 32px;
        max-width: 1400px;
        margin: 0 auto;
        background-color: var(--bg-primary);
        min-height: calc(100vh - 64px);
      }

      .dashboard-title {
        font-size: 32px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 32px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .title-icon {
        font-size: 36px;
      }

      /* Grid de Estadísticas */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
      }

      .stat-card {
        background: var(--bg-card);
        border-radius: 12px;
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 20px;
        border: 1px solid var(--border-color);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: relative;
        overflow: hidden;
        cursor: pointer;
      }

      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: currentColor;
      }

      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
      }

      .stat-icon {
        font-size: 40px;
        flex-shrink: 0;
      }

      .stat-content {
        flex: 1;
      }

      .stat-value {
        font-size: 36px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
      }

      /* Colores de tarjetas - SOBRIOS */
      .stat-total {
        color: #64748b;
      }
      .stat-process {
        color: #3b82f6;
      }
      .stat-success {
        color: #10b981;
      }
      .stat-warning {
        color: #f59e0b;
      }
      .stat-info {
        color: #06b6d4;
      }
      .stat-closed {
        color: #8b5cf6;
      }
      .stat-danger {
        color: #ef4444;
      }

      /* Secciones */
      .section {
        margin-top: 40px;
      }

      .section-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Tabla de Estadísticas */
      .table-container {
        background: var(--bg-card);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-color);
      }

      .stats-table {
        width: 100%;
        border-collapse: collapse;
      }

      .stats-table thead {
        background: var(--bg-secondary);
      }

      .stats-table th {
        padding: 16px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        border-bottom: 1px solid var(--border-color);
      }

      .stats-table th.text-center {
        text-align: center;
      }

      .stats-table td {
        padding: 16px;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-color);
      }

      .stats-table tbody tr {
        transition: background 0.2s ease;
      }

      .stats-table tbody tr:hover {
        background: var(--bg-hover);
      }

      .stats-table tbody tr:last-child td {
        border-bottom: none;
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--primary-light);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }

      .user-name {
        font-weight: 600;
      }

      .email-cell {
        color: var(--text-secondary);
        font-size: 14px;
      }

      .number-cell {
        text-align: center;
        font-weight: 600;
        font-size: 16px;
      }

      .success-text {
        color: var(--success);
      }

      .warning-text {
        color: var(--warning);
      }

      .progress-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .progress-bar {
        flex: 1;
        height: 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-fill.high {
        background: var(--success);
      }

      .progress-fill.medium {
        background: var(--warning);
      }

      .progress-fill.low {
        background: var(--danger);
      }

      .progress-text {
        font-weight: 600;
        font-size: 14px;
        min-width: 45px;
        text-align: right;
        color: var(--text-primary);
      }

      /* Grid de Atrasos */
      .atrasos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
      }

      .atraso-card {
        background: var(--bg-card);
        border-radius: 12px;
        padding: 20px;
        border: 1px solid var(--border-color);
        border-left: 4px solid var(--danger);
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .atraso-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        border-left-width: 6px;
      }

      .atraso-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 16px;
        gap: 12px;
      }

      .atraso-header h3 {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
        flex: 1;
      }

      .atraso-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .badge-critical {
        background: rgba(239, 68, 68, 0.15);
        color: #dc2626;
        border: 1px solid #dc2626;
      }

      .badge-high {
        background: rgba(245, 158, 11, 0.15);
        color: #d97706;
        border: 1px solid #d97706;
      }

      .badge-medium {
        background: rgba(234, 179, 8, 0.15);
        color: #ca8a04;
        border: 1px solid #ca8a04;
      }

      .atraso-info {
        margin-bottom: 16px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
        gap: 12px;
      }

      .info-row:last-child {
        border-bottom: none;
      }

      .info-label {
        color: var(--text-muted);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .info-value {
        color: var(--text-primary);
        font-weight: 500;
        font-size: 14px;
        text-align: right;
      }

      .badge {
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .badge-primary {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        border: 1px solid #3b82f6;
      }

      .badge-success {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border: 1px solid #10b981;
      }

      .badge-warning {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border: 1px solid #f59e0b;
      }

      .badge-secondary {
        background: rgba(100, 116, 139, 0.1);
        color: #64748b;
        border: 1px solid #64748b;
      }

      .pendientes-list {
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
      }

      .pendientes-header {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .pendiente-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
        gap: 12px;
      }

      .pendiente-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .pendiente-tipo {
        color: var(--text-primary);
        font-weight: 500;
        font-size: 14px;
      }

      .pendiente-atraso {
        color: var(--danger);
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }

      .card-footer {
        text-align: right;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
      }

      .view-link {
        color: var(--primary-light);
        font-size: 14px;
        font-weight: 600;
        transition: color 0.2s ease;
      }

      .atraso-card:hover .view-link {
        color: var(--primary);
      }

      /* Estados de carga */
      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: var(--text-secondary);
      }

      .spinner {
        width: 48px;
        height: 48px;
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

      .empty-state,
      .success-state {
        text-align: center;
        padding: 60px 20px;
      }

      .empty-icon,
      .success-icon {
        font-size: 64px;
        margin-bottom: 20px;
      }

      .empty-state h3,
      .success-state h3 {
        font-size: 24px;
        color: var(--text-primary);
        margin-bottom: 8px;
      }

      .empty-state p,
      .success-state p {
        color: var(--text-secondary);
        font-size: 16px;
        margin-bottom: 20px;
      }

      .btn-retry {
        background: var(--primary-light);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-retry:hover {
        background: var(--primary);
        transform: translateY(-2px);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .dashboard-container {
          padding: 20px;
        }

        .dashboard-title {
          font-size: 24px;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .atrasos-grid {
          grid-template-columns: 1fr;
        }

        .stats-table {
          font-size: 14px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          font-size: 12px;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  dashboard: Dashboard | null = null;
  isLoading = true;

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.isLoading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar dashboard:', error);
        this.isLoading = false;
      },
    });
  }

  calcularPorcentaje(alDia: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((alDia / total) * 100);
  }

  getInitials(username: string): string {
    if (!username) return '?';
    const parts = username.split(/[\s._-]+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  getBadgeClass(estado: string): string {
    const estadoLower = estado?.toLowerCase() || '';
    if (estadoLower === 'cerrado') return 'badge-success';
    if (estadoLower === 'gdc') return 'badge-warning';
    if (estadoLower.includes('proceso') || estadoLower === 'asignado')
      return 'badge-primary';
    return 'badge-secondary';
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      PENDIENTE: 'Pendiente',
      ASIGNADO: 'Asignado',
      EN_PROCESO: 'En Proceso',
      GDC: 'Con GDC',
      CERRADO: 'Cerrado',
    };
    return labels[estado] || estado;
  }

  verConsolidados(): void {
    this.router.navigate(['/consolidados']);
  }

  verDetalle(id: number): void {
    this.router.navigate(['/consolidados', id]);
  }
}
