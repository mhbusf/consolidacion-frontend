import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { ConsolidadoGDCHistorico, Dashboard } from '../../../core/models/consolidado.model';

@Component({
  selector: 'app-estadisticas-gdc',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Estadísticas e Histórico de Cierres</h1>

      @if (isLoadingDashboard || isLoadingHistorico) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      }

      @if (!isLoadingDashboard && dashboard?.estadisticasPorUsuario?.length) {
        <section class="section">
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
                @for (stat of dashboard?.estadisticasPorUsuario; track stat.username) {
                  <tr>
                    <td class="user-cell">
                      <span class="user-avatar">{{ getInitials(stat.username) }}</span>
                      <span class="user-name">{{ stat.username }}</span>
                    </td>
                    <td class="email-cell">{{ stat.email }}</td>
                    <td class="number-cell">{{ stat.totalAsignados }}</td>
                    <td class="number-cell success-text">{{ stat.alDia }}</td>
                    <td class="number-cell warning-text">{{ stat.conAtrasos }}</td>
                    <td class="progress-cell">
                      <div class="progress-bar">
                        <div
                          class="progress-fill"
                          [style.width.%]="calcularPorcentaje(stat.alDia, stat.totalAsignados)"
                          [ngClass]="{
                            high: calcularPorcentaje(stat.alDia, stat.totalAsignados) >= 80,
                            medium: calcularPorcentaje(stat.alDia, stat.totalAsignados) >= 50 && calcularPorcentaje(stat.alDia, stat.totalAsignados) < 80,
                            low: calcularPorcentaje(stat.alDia, stat.totalAsignados) < 50
                          }"
                        ></div>
                      </div>
                      <span class="progress-text">{{ calcularPorcentaje(stat.alDia, stat.totalAsignados) }}%</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <section class="section">
        <h2 class="section-title">Histórico de Cierres ({{ historico.length }})</h2>

        @if (!isLoadingHistorico && errorHistorico) {
          <div class="error-state">
            <p>{{ errorHistorico }}</p>
            <button type="button" class="btn-retry" (click)="cargarHistorico()">Reintentar</button>
          </div>
        }

        @if (!isLoadingHistorico && !errorHistorico && historico.length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>Aún no hay cierres registrados.</p>
          </div>
        }

        @if (historico.length > 0) {
          <div class="table-container history-table-container">
            <table class="stats-table history-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>GDC</th>
                  <th>Usuario Asignado</th>
                  <th>Comuna</th>
                  <th>Teléfono</th>
                  <th>Fecha Cierre</th>
                  <th>Comentario Cierre</th>
                </tr>
              </thead>
              <tbody>
                @for (h of historico; track h.id) {
                  <tr>
                    <td data-label="Nombre" class="fw-bold history-name">{{ h.nombre || '-' }}</td>
                    <td data-label="Tipo">
                      <span
                        class="badge-closure"
                        [ngClass]="h.tipoCierre === 'GDC' ? 'badge-closure-gdc' : 'badge-closure-closed'">
                        {{ h.tipoCierre === 'GDC' ? 'GDC' : 'Cierre sin GDC' }}
                      </span>
                    </td>
                    <td data-label="GDC">
                      @if (h.tipoCierre === 'GDC') {
                        <span class="badge-gdc">{{ h.gdc || 'No registrado' }}</span>
                      } @else {
                        <span class="text-muted-cell">No aplica</span>
                      }
                    </td>
                    <td data-label="Usuario asignado">
                      <div class="user-cell">
                        <span class="user-avatar">{{ getInitials(h.usuarioAsignado || '') }}</span>
                        <span class="user-name">{{ h.usuarioAsignado || 'Sin asignar' }}</span>
                      </div>
                    </td>
                    <td data-label="Comuna" class="text-muted-cell">{{ h.comunaNombre || '-' }}</td>
                    <td data-label="Teléfono" class="text-muted-cell">{{ h.telefono || '-' }}</td>
                    <td data-label="Fecha de cierre" class="text-muted-cell">
                      {{ h.fechaCierre ? (h.fechaCierre | date:'dd/MM/yyyy HH:mm') : '-' }}
                    </td>
                    <td data-label="Comentario de cierre" class="comentario-cell">{{ h.comentarioCierre || '-' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .page-container { padding: 32px; max-width: 1400px; margin: 0 auto; min-height: calc(100vh - 64px); }
    .page-title { font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 28px; }
    .section { margin-top: 40px; }
    .section:first-of-type { margin-top: 0; }
    .section-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .table-container { background: var(--bg-card); border-radius: 12px; overflow-x: auto; border: 1px solid var(--border-color); }
    .stats-table { width: 100%; border-collapse: collapse; min-width: 980px; }
    .stats-table thead { background: var(--bg-secondary); }
    .stats-table th { padding: 16px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-bottom: 1px solid var(--border-color); }
    .stats-table th.text-center { text-align: center; }
    .stats-table td { padding: 16px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); }
    .stats-table tbody tr:hover { background: var(--bg-hover); }
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--primary-light); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .user-name, .fw-bold { font-weight: 600; color: var(--text-primary); }
    .email-cell, .text-muted-cell, .comentario-cell { color: var(--text-secondary); font-size: 14px; }
    .number-cell { text-align: center; font-weight: 600; font-size: 16px; }
    .success-text { color: var(--success); }
    .warning-text { color: var(--warning); }
    .progress-cell { display: flex; align-items: center; gap: 12px; min-width: 220px; }
    .progress-bar { flex: 1; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
    .progress-fill.high { background: var(--success); }
    .progress-fill.medium { background: var(--warning); }
    .progress-fill.low { background: var(--danger); }
    .progress-text { font-weight: 600; font-size: 14px; min-width: 45px; text-align: right; color: var(--text-primary); }
    .badge-gdc { background: rgba(6, 182, 212, 0.15); color: #0e7490; border: 1px solid #06b6d4; padding: 4px 10px; border-radius: 10px; font-size: 12px; font-weight: 700; white-space: nowrap; }
    .badge-closure { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; white-space: nowrap; }
    .badge-closure-gdc { background: rgba(139, 92, 246, 0.1); color: #7c3aed; border: 1px solid #8b5cf6; }
    .badge-closure-closed { background: rgba(71, 85, 105, 0.1); color: #334155; border: 1px solid #64748b; }
    .loading, .empty-state, .error-state { text-align: center; padding: 48px 20px; color: var(--text-secondary); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; }
    .error-state p { margin-bottom: 14px; color: var(--danger); }
    .btn-retry { min-height: 44px; padding: 10px 18px; border: 0; border-radius: 10px; background: var(--primary-light); color: white; cursor: pointer; font-weight: 700; }
    .spinner { width: 48px; height: 48px; border: 4px solid var(--bg-secondary); border-top-color: var(--primary-light); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    .empty-icon { font-size: 36px; display: block; margin-bottom: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) {
      .page-container { padding: 20px 12px; }
      .page-title { font-size: 24px; }
      .section-title { font-size: 20px; }
      .history-table-container { overflow: visible; background: transparent; border: 0; box-shadow: none; }
      .history-table { display: block; min-width: 0; }
      .history-table thead { display: none; }
      .history-table tbody { display: grid; gap: 14px; }
      .history-table tbody tr { display: flex; flex-direction: column; overflow: hidden; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; }
      .history-table tbody tr:hover { background: var(--bg-card); }
      .history-table td { display: grid; grid-template-columns: minmax(105px, 0.45fr) minmax(0, 1fr); gap: 12px; align-items: start; padding: 11px 14px; overflow-wrap: anywhere; }
      .history-table td::before { content: attr(data-label); color: var(--text-muted); font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
      .history-table .history-name { padding-top: 14px; padding-bottom: 14px; background: var(--bg-secondary); font-size: 16px; }
      .history-table td:last-child { border-bottom: 0; }
      .history-table .comentario-cell { white-space: normal; }
    }
  `]
})
export class EstadisticasGdcComponent implements OnInit {
  dashboard: Dashboard | null = null;
  historico: ConsolidadoGDCHistorico[] = [];
  isLoadingDashboard = true;
  isLoadingHistorico = true;
  errorHistorico = '';

  constructor(
    private dashboardService: DashboardService,
    private consolidadoService: ConsolidadoService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.isLoadingDashboard = false;
      },
      error: () => {
        this.isLoadingDashboard = false;
      }
    });

    this.cargarHistorico();
  }

  cargarHistorico(): void {
    this.isLoadingHistorico = true;
    this.errorHistorico = '';
    this.consolidadoService.obtenerHistorico().subscribe({
      next: (data) => {
        this.historico = data;
        this.isLoadingHistorico = false;
      },
      error: (error) => {
        this.historico = [];
        this.errorHistorico = error?.error?.message || 'No fue posible cargar el histórico de cierres.';
        this.isLoadingHistorico = false;
      }
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
}
