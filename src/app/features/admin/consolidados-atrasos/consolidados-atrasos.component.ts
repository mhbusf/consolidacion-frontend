import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ConsolidadoEstado, Dashboard } from '../../../core/models/consolidado.model';
import { WhatsAppUrlPipe } from '../../../shared/pipes/whatsapp-url.pipe';
import { institutionalWhatsAppMessage } from '../../../shared/utils/institutional-whatsapp-message';

@Component({
  selector: 'app-consolidados-atrasos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, WhatsAppUrlPipe],
  template: `
    <main class="page-container">
      <header class="page-header">
        <div><p class="eyebrow">Operación diaria</p><h1 class="page-title">Seguimientos con atrasos</h1><p>Prioriza las obligaciones vencidas y contacta a cada persona desde esta bandeja.</p></div>
        <a routerLink="/reportes" class="report-link">Descargar informe Excel</a>
      </header>

      @if (isLoading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando consolidados con atrasos...</p>
        </div>
      }

      @if (!isLoading && errorCarga) {
        <section class="error-state" role="alert">
          <strong>No pudimos cargar los atrasos</strong>
          <span>{{ errorCarga }}</span>
          <button type="button" (click)="cargar()">Reintentar</button>
        </section>
      }

      @if (!isLoading && !errorCarga && dashboard) {
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
            <h3>Sin atrasos</h3>
            <p>{{ busquedaAtrasos ? 'No hay coincidencias para la búsqueda.' : 'Todos los seguimientos están al día.' }}</p>
          </div>
        }

        @if (consolidadosConAtrasosFiltrados.length > 0) {
          <div class="table-container">
            <table class="stats-table">
              <thead>
                <tr>
                   <th>Nombre</th>
                   <th>Teléfono</th>
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
                    <td class="fw-bold" data-label="Nombre">{{ consolidado.titulo }}</td>
                    <td class="text-muted-cell" data-label="Teléfono">{{ consolidado.telefono }}</td>
                    <td class="text-muted-cell" data-label="Asignado a">{{ consolidado.asignadoA }}</td>
                    <td class="text-muted-cell" data-label="Fecha ingreso">{{ consolidado.fechaIngreso | date : 'dd/MM/yyyy' }}</td>
                    <td data-label="Estado">
                      <span class="badge" [ngClass]="getBadgeClass(consolidado.estado)">
                        {{ getEstadoLabel(consolidado.estado) }}
                      </span>
                    </td>
                    <td data-label="Días atraso">
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
                    <td class="comentario-cell" data-label="Pendientes">
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
                    <td data-label="Acciones">
                      <div class="row-actions">
                        @if ((consolidado.telefono | whatsappUrl: mensajeWhatsApp(consolidado)); as whatsappUrl) {
                          <a class="btn-whatsapp" [href]="whatsappUrl" target="_blank" rel="noopener noreferrer" [attr.aria-label]="'Abrir WhatsApp con ' + consolidado.titulo">WhatsApp</a>
                        }
                        <button class="btn-ver" (click)="verDetalle(consolidado.id)">Ver ficha</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .page-container { padding: 32px; max-width: 1400px; margin: 0 auto; min-height: calc(100vh - 64px); }
    .page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; padding: 28px; border-radius: 18px; color: white; background: linear-gradient(125deg,#12314b,#0f5265); }
    .page-header p { margin: 7px 0 0; color: #d8e8ef; }.eyebrow { color: #6cd2d5 !important; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .page-title { font-size: 32px; font-weight: 800; color: white; margin: 0; }
    .report-link { flex: 0 0 auto; padding: 10px 14px; border: 1px solid rgba(255,255,255,.45); border-radius: 8px; color: white; font-weight: 700; text-decoration: none; }
    .search-bar { margin-bottom: 22px; }
    .search-input { max-width: 520px; }
    .form-control { width: 100%; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: var(--bg-secondary); color: var(--text-primary); }
    .table-container { background: var(--bg-card); border-radius: 12px; overflow-x: auto; border: 1px solid var(--border-color); }
    .stats-table { width: 100%; border-collapse: collapse; min-width: 1100px; }
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
    .row-actions { display: flex; gap: 7px; }.btn-ver,.btn-whatsapp { border: none; padding: 7px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: none; white-space: nowrap; }.btn-ver { background: rgba(59,130,246,.15); color: #2563eb; }.btn-whatsapp { background: #147a40; color: white; }
    .loading, .empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
    .error-state { display: grid; justify-items: start; gap: 8px; padding: 24px; border: 1px solid #efb1b6; border-radius: 12px; color: #8f1f29; background: #fff3f4; }.error-state button { padding: 8px 12px; border: 0; border-radius: 7px; color: white; background: #8f1f29; font-weight: 700; cursor: pointer; }
    .spinner { width: 48px; height: 48px; border: 4px solid var(--bg-secondary); border-top-color: var(--primary-light); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    .empty-icon { font-size: 56px; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) {
      .page-container { padding: 18px 12px; }.page-header { align-items: stretch; flex-direction: column; padding: 22px; }.page-title { font-size: 25px; }.report-link { text-align: center; }
      .table-container { border: 0; background: transparent; overflow: visible; }.stats-table { min-width: 0; }.stats-table thead { display: none; }.stats-table,.stats-table tbody,.stats-table tr,.stats-table td { display: block; width: 100%; box-sizing: border-box; }.stats-table tr { margin-bottom: 14px; padding: 16px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-card); }.stats-table td { display: grid; grid-template-columns: 105px 1fr; gap: 12px; padding: 7px 0; border: 0; }.stats-table td::before { content: attr(data-label); color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }.row-actions { flex-wrap: wrap; }
    }
  `]
})
export class ConsolidadosAtrasosComponent implements OnInit {
  dashboard: Dashboard | null = null;
  isLoading = true;
  errorCarga = '';
  busquedaAtrasos = '';

  constructor(private dashboardService: DashboardService, private router: Router) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.isLoading = true;
    this.errorCarga = '';
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.isLoading = false;
      },
      error: () => {
        this.dashboard = null;
        this.errorCarga = 'Revisa tu conexión y vuelve a intentarlo.';
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
      c.telefono,
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
    this.router.navigate(['/consolidados', id], { queryParams: { origen: 'atrasos' } });
  }

  mensajeWhatsApp(consolidado: ConsolidadoEstado): string {
    return institutionalWhatsAppMessage(consolidado.titulo, consolidado.asignadoA);
  }
}
