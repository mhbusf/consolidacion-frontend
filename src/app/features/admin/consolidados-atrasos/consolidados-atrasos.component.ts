import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ConsolidadoEstado, Dashboard } from '../../../core/models/consolidado.model';

@Component({
  selector: 'app-consolidados-atrasos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">⚠️ Consolidados con Atrasos ({{ dashboard?.consolidadosConAtrasos?.length || 0 }})</h1>

      @if (isLoading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando consolidados con atrasos...</p>
        </div>
      }

      @if (!isLoading && dashboard) {
        <div class="search-bar">
          <input
            type="search"
            [(ngModel)]="busquedaAtrasos"
            class="form-control search-input"
            placeholder="Buscar por nombre, asignado, estado o comentario pendiente..."
          />
        </div>

        @if (consolidadosConAtrasosFiltrados.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🎉</div>
            <h3>Sin atrasos</h3>
            <p>No hay resultados para mostrar.</p>
          </div>
        }

        @if (consolidadosConAtrasosFiltrados.length > 0) {
          <div class="table-container">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Asignado a</th>
                  <th>Fecha ingreso</th>
                  <th>Estado</th>
                  <th>Días atraso</th>
                  <th>Comentarios pendientes</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (consolidado of consolidadosConAtrasosFiltrados; track consolidado.id) {
                  <tr>
                    <td class="fw-bold">{{ consolidado.titulo }}</td>
                    <td class="text-muted-cell">{{ consolidado.asignadoA }}</td>
                    <td class="text-muted-cell">{{ consolidado.fechaIngreso | date : 'dd/MM/yyyy' }}</td>
                    <td>
                      <span class="badge" [ngClass]="getBadgeClass(consolidado.estado)">
                        {{ getEstadoLabel(consolidado.estado) }}
                      </span>
                    </td>
                    <td>
                      <span
                        class="atraso-badge"
                        [ngClass]="{
                          'badge-critical': consolidado.diasDeAtraso > 5,
                          'badge-high': consolidado.diasDeAtraso > 2 && consolidado.diasDeAtraso <= 5,
                          'badge-medium': consolidado.diasDeAtraso <= 2
                        }"
                      >
                        {{ consolidado.diasDeAtraso }} día{{ consolidado.diasDeAtraso !== 1 ? 's' : '' }}
                      </span>
                    </td>
                    <td class="comentario-cell">
                      @if (consolidado.comentariosPendientes?.length) {
                        @for (pendiente of consolidado.comentariosPendientes; track pendiente) {
                          <span class="pendiente-inline">
                            {{ pendiente.tipo }} ({{ pendiente.diasDeAtraso }} día{{ pendiente.diasDeAtraso !== 1 ? 's' : '' }})
                          </span>
                        }
                      } @else {
                        -
                      }
                    </td>
                    <td>
                      <button class="btn-ver" (click)="verDetalle(consolidado.id)">Ver</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .page-container { padding: 32px; max-width: 1400px; margin: 0 auto; min-height: calc(100vh - 64px); }
    .page-title { font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 28px; }
    .search-bar { margin-bottom: 22px; }
    .search-input { max-width: 520px; }
    .form-control { width: 100%; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: var(--bg-secondary); color: var(--text-primary); }
    .table-container { background: var(--bg-card); border-radius: 12px; overflow-x: auto; border: 1px solid var(--border-color); }
    .stats-table { width: 100%; border-collapse: collapse; min-width: 980px; }
    .stats-table thead { background: var(--bg-secondary); }
    .stats-table th { padding: 16px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-bottom: 1px solid var(--border-color); }
    .stats-table td { padding: 16px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); }
    .stats-table tbody tr:hover { background: var(--bg-hover); }
    .fw-bold { font-weight: 600; color: var(--text-primary); }
    .text-muted-cell, .comentario-cell { color: var(--text-secondary); font-size: 14px; }
    .comentario-cell { max-width: 260px; }
    .pendiente-inline { display: block; margin-bottom: 4px; }
    .badge, .atraso-badge { padding: 4px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
    .badge-primary { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid #3b82f6; }
    .badge-success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid #10b981; }
    .badge-warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid #f59e0b; }
    .badge-secondary { background: rgba(100, 116, 139, 0.1); color: #64748b; border: 1px solid #64748b; }
    .badge-critical { background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid #dc2626; }
    .badge-high { background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid #d97706; }
    .badge-medium { background: rgba(234, 179, 8, 0.15); color: #ca8a04; border: 1px solid #ca8a04; }
    .btn-ver { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: none; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .loading, .empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
    .spinner { width: 48px; height: 48px; border: 4px solid var(--bg-secondary); border-top-color: var(--primary-light); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    .empty-icon { font-size: 56px; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) { .page-container { padding: 20px; } .page-title { font-size: 24px; } }
  `]
})
export class ConsolidadosAtrasosComponent implements OnInit {
  dashboard: Dashboard | null = null;
  isLoading = true;
  busquedaAtrasos = '';

  constructor(private dashboardService: DashboardService, private router: Router) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get consolidadosConAtrasosFiltrados(): ConsolidadoEstado[] {
    const consolidados = this.dashboard?.consolidadosConAtrasos || [];
    const term = this.busquedaAtrasos.trim().toLowerCase();
    if (!term) return consolidados;

    return consolidados.filter(c => [
      c.titulo,
      c.asignadoA,
      c.estado,
      c.fechaIngreso,
      c.diasDeAtraso?.toString(),
      ...(c.comentariosPendientes || []).flatMap(p => [p.tipo, p.diasDeAtraso?.toString()]),
    ].some(value => (value || '').toLowerCase().includes(term)));
  }

  getBadgeClass(estado: string): string {
    const estadoLower = estado?.toLowerCase() || '';
    if (estadoLower === 'cerrado') return 'badge-success';
    if (estadoLower === 'gdc') return 'badge-warning';
    if (estadoLower.includes('proceso') || estadoLower === 'asignado') return 'badge-primary';
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

  verDetalle(id: number): void {
    this.router.navigate(['/consolidados', id]);
  }
}
