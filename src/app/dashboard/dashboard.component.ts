import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService, ConsolidadorResumen } from '../core/services/dashboard.service';
import { ConsolidadoService } from '../core/services/consolidado.service';
import { AuthService } from '../core/services/auth.service';
import { Dashboard, ConsolidadoEstado, ConsolidadoResponse } from '../core/models/consolidado.model';
import { User } from '../core/models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <h1 class="dashboard-title">
        <span class="title-icon">📊</span>
        Dashboard de Seguimiento
      </h1>
    
      <!-- SOLO MOSTRAR SI HAY DATOS -->
      @if (dashboard) {
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
          <!-- Sin Asignar -->
          <div class="stat-card stat-danger">
            <div class="stat-icon">🚨</div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboard.consolidadosSinAsignar }}</div>
              <div class="stat-label">Sin Asignar</div>
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
          <!-- Cafe con Jesus -->
          <div class="stat-card stat-cafe" (click)="verCafeConJesus()">
            <div class="stat-icon">☕</div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboard.totalCafeConJesus }}</div>
              <div class="stat-label">Cafe con Jesus</div>
            </div>
          </div>
        </div>
        <!-- Histórico GDC -->
        @if (historico.length > 0) {
          <div class="section">
            <h2 class="section-title">🗂️ Histórico GDC ({{ historico.length }})</h2>
            <div class="table-container">
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>GDC</th>
                    <th>Usuario Asignado</th>
                    <th>Comuna</th>
                    <th>Teléfono</th>
                    <th>Fecha Cierre</th>
                    <th>Comentario Cierre</th>
                  </tr>
                </thead>
                <tbody>
                  @for (h of historico; track h) {
                    <tr>
                      <td class="fw-bold">{{ h.nombre }}</td>
                      <td>
                        <span class="badge-gdc">{{ h.gdc }}</span>
                      </td>
                      <td>
                        <div class="user-cell">
                          <span class="user-avatar">{{ getInitials(h.usuarioAsignado || '') }}</span>
                          <span class="user-name">{{ h.usuarioAsignado || 'Sin asignar' }}</span>
                        </div>
                      </td>
                      <td class="text-muted-cell">{{ h.comuna?.nombre || '—' }}</td>
                      <td class="text-muted-cell">{{ h.telefono || '—' }}</td>
                      <td class="text-muted-cell">{{ h.fechaCierre | date:'dd/MM/yyyy' }}</td>
                      <td class="comentario-cell">{{ h.comentarioCierre || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
        @if (historico.length === 0 && !isLoadingHistorico) {
          <div class="section empty-historico">
            <h2 class="section-title">🗂️ Histórico GDC</h2>
            <div class="empty-historico-msg">
              <span class="empty-icon-sm">📭</span>
              <p>Aún no hay consolidados cerrados con GDC.</p>
            </div>
          </div>
        }
        <!-- Estadísticas por Reunión -->
        @if (dashboard.estadisticasPorReunion?.length) {
          <div class="section">
            <h2 class="section-title">🏛️ Consolidados por Reunión</h2>
            <div class="reunion-grid">
              @for (r of dashboard.estadisticasPorReunion; track r) {
                <div class="reunion-card">
                  <div class="reunion-nombre">{{ r.nombreReunion }}</div>
                  <div class="reunion-count">{{ r.totalConsolidados }}</div>
                  <div class="reunion-label">consolidados</div>
                </div>
              }
            </div>
          </div>
        }
        <!-- Estadísticas por Usuario -->
        @if (dashboard.estadisticasPorUsuario?.length) {
          <div class="section">
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
                  @for (stat of dashboard.estadisticasPorUsuario; track stat) {
                    <tr>
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
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
          <!-- Consolidados con Atrasos -->
          @if (dashboard.consolidadosConAtrasos?.length) {
            <div class="section">
              <h2 class="section-title">
                ⚠️ Consolidados con Atrasos ({{
                dashboard.consolidadosConAtrasos.length
                }})
              </h2>
              <div class="search-bar">
                <input
                  type="search"
                  [(ngModel)]="busquedaAtrasos"
                  class="form-control search-input"
                  placeholder="Buscar por nombre, asignado, estado o comentario pendiente..."
                />
              </div>

              @if (consolidadosConAtrasosFiltrados.length === 0) {
                <div class="resumen-seccion-empty">
                  No hay resultados para "{{ busquedaAtrasos }}".
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
                      @for (consolidado of consolidadosConAtrasosFiltrados; track consolidado) {
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
                              —
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
            </div>
          }
            <!-- Mensaje cuando todo está al día -->
            @if (!dashboard.consolidadosConAtrasos?.length) {
              <div
                class="success-state"
                >
                <div class="success-icon">🎉</div>
                <h3>¡Excelente trabajo!</h3>
                <p>No hay consolidados con atrasos en este momento.</p>
              </div>
            }
          }
    
          <!-- Sección Cartera por Consolidador -->
          <div class="section section-consolidador">
            <h2 class="section-title">👤 Cartera por Consolidador</h2>
    
            <div class="selector-card">
              <label class="selector-label">Selecciona un consolidador</label>
              <div class="selector-row">
                <select [(ngModel)]="usernameSeleccionado" class="form-control" (ngModelChange)="onSeleccionarConsolidador()">
                  <option value="">-- Selecciona --</option>
                  @for (u of usuarios; track u) {
                    <option [value]="u.username">{{ u.username }}</option>
                  }
                </select>
                @if (isLoadingResumen) {
                  <div class="spinner-inline"></div>
                }
              </div>
            </div>
    
            @if (!usernameSeleccionado && !isLoadingResumen) {
              <div class="resumen-empty">
                <span class="empty-icon-sm">👤</span>
                <p>Selecciona un consolidador para ver su cartera</p>
              </div>
            }
    
            @if (resumenConsolidador && !isLoadingResumen) {
              <!-- Métricas -->
              <div class="resumen-metrics">
                <div class="resumen-metric metric-blue">
                  <div class="resumen-metric-label">Café con Jesús</div>
                  <div class="resumen-metric-value">{{ resumenConsolidador.totalCafes }}</div>
                </div>
                <div class="resumen-metric metric-green">
                  <div class="resumen-metric-label">Consolidados</div>
                  <div class="resumen-metric-value">{{ resumenConsolidador.totalConsolidados }}</div>
                </div>
                <div class="resumen-metric metric-purple">
                  <div class="resumen-metric-label">Total personas</div>
                  <div class="resumen-metric-value">{{ resumenConsolidador.totalCafes + resumenConsolidador.totalConsolidados }}</div>
                </div>
              </div>
              <!-- Tabla Café con Jesús -->
              <div class="resumen-seccion">
                <div class="resumen-seccion-header header-cafe">
                  <span>☕</span>
                  <span class="resumen-seccion-titulo">Café con Jesús</span>
                  <span class="resumen-count">{{ resumenConsolidador.totalCafes }}</span>
                </div>
                @if (resumenConsolidador.cafes.length === 0) {
                  <div class="resumen-seccion-empty">
                    No tiene personas asignadas en Café con Jesús
                  </div>
                }
                @if (resumenConsolidador.cafes.length > 0) {
                  <div class="table-container">
                    <table class="stats-table">
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
                        @for (c of resumenConsolidador.cafes; track c) {
                          <tr>
                            <td class="fw-bold">{{ c.nombre }} {{ c.apellido }}</td>
                            <td class="text-muted-cell">{{ c.telefono }}</td>
                            <td class="text-muted-cell">{{ c.edad || '—' }}</td>
                            <td class="text-muted-cell">{{ c.invitadoPor || '—' }}</td>
                            <td class="text-muted-cell">{{ c.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                            <td>
                              <span class="badge" [class.badge-success]="c.asistio" [class.badge-warning]="!c.asistio">
                                {{ c.asistio ? 'Sí' : 'No' }}
                              </span>
                            </td>
                            <td class="comentario-cell">{{ c.comentario || '—' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
              <!-- Tabla Consolidados -->
              <div class="resumen-seccion">
                <div class="resumen-seccion-header header-consolidados">
                  <span>👥</span>
                  <span class="resumen-seccion-titulo">Consolidados</span>
                  <span class="resumen-count">{{ resumenConsolidador.totalConsolidados }}</span>
                </div>
                @if (resumenConsolidador.consolidados.length === 0) {
                  <div class="resumen-seccion-empty">
                    No tiene personas asignadas en Consolidados
                  </div>
                }
                @if (resumenConsolidador.consolidados.length > 0) {
                  <div class="table-container">
                    <table class="stats-table">
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
                        @for (c of resumenConsolidador.consolidados; track c) {
                          <tr>
                            <td class="fw-bold">{{ c.nombre }}</td>
                            <td class="text-muted-cell">{{ c.telefono }}</td>
                            <td class="text-muted-cell">{{ c.edad || '—' }}</td>
                            <td class="text-muted-cell">{{ c.quienInvito || '—' }}</td>
                            <td class="text-muted-cell">{{ c.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                            <td>
                              <span class="badge" [ngClass]="getBadgeEstado(c.estado)">
                                {{ getLabelEstado(c.estado) }}
                              </span>
                            </td>
                            <td>
                              <button class="btn-ver" (click)="verDetalle(c.id)">Ver</button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            }
          </div>
    
          <!-- Estado de carga -->
          @if (isLoading) {
            <div class="loading">
              <div class="spinner"></div>
              <p>Cargando dashboard...</p>
            </div>
          }
    
          <!-- Mensaje cuando no hay datos -->
          @if (!isLoading && !dashboard) {
            <div class="empty-state">
              <div class="empty-icon">📊</div>
              <h3>Sin datos disponibles</h3>
              <p>No se pudo cargar la información del dashboard.</p>
              <button class="btn-retry" (click)="cargarDashboard()">
                🔄 Reintentar
              </button>
            </div>
          }
        </div>
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
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
      .stat-cafe {
        color: #a16207;
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

      .search-bar {
        margin-bottom: 16px;
      }

      .search-input {
        max-width: 520px;
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

      .pendiente-inline {
        display: block;
        margin-bottom: 4px;
        color: var(--text-secondary);
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

      /* Histórico GDC */
      .badge-gdc {
        background: rgba(6, 182, 212, 0.15);
        color: #06b6d4;
        border: 1px solid #06b6d4;
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .fw-bold {
        font-weight: 600;
        color: var(--text-primary);
      }

      .text-muted-cell {
        color: var(--text-secondary);
        font-size: 14px;
      }

      .comentario-cell {
        color: var(--text-secondary);
        font-size: 13px;
        max-width: 220px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .empty-historico .table-container {
        display: none;
      }

      .empty-historico-msg {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 32px;
        text-align: center;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: center;
      }

      .empty-icon-sm {
        font-size: 28px;
      }

      .empty-historico-msg p {
        margin: 0;
        font-size: 15px;
      }

      /* Estadísticas por Reunión */
      .reunion-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 16px;
      }

      .reunion-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        border-top: 3px solid var(--primary-light);
      }

      .reunion-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
      }

      .reunion-nombre {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .reunion-count {
        font-size: 40px;
        font-weight: 700;
        color: var(--primary-light);
        line-height: 1;
        margin-bottom: 6px;
      }

      .reunion-label {
        font-size: 12px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Sección Cartera por Consolidador */
      .section-consolidador {
        padding-bottom: 40px;
      }

      .selector-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px 24px;
        margin-bottom: 24px;
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
        max-width: 400px;
        width: 100%;
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

      .resumen-empty {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
      }

      .resumen-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .resumen-metric {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
      }

      .metric-blue   { border-left: 4px solid #3b82f6; }
      .metric-green  { border-left: 4px solid #22c55e; }
      .metric-purple { border-left: 4px solid #8b5cf6; }

      .resumen-metric-label {
        color: var(--text-muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .resumen-metric-value {
        color: var(--text-primary);
        font-size: 32px;
        font-weight: 700;
        margin-top: 8px;
      }

      .resumen-seccion {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 16px;
      }

      .resumen-seccion-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        border-bottom: 1px solid var(--border-color);
        font-size: 16px;
        font-weight: 700;
      }

      .header-cafe         { background: rgba(234,179,8,0.08);  border-left: 4px solid #eab308; }
      .header-consolidados { background: rgba(59,130,246,0.08); border-left: 4px solid #3b82f6; }

      .resumen-seccion-titulo {
        flex: 1;
        color: var(--text-primary);
      }

      .resumen-count {
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 3px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 700;
      }

      .resumen-seccion-empty {
        padding: 28px;
        text-align: center;
        color: var(--text-muted);
        font-size: 14px;
      }

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
  historico: ConsolidadoResponse[] = [];
  isLoading = true;
  isLoadingHistorico = true;

  usuarios: User[] = [];
  usernameSeleccionado = '';
  resumenConsolidador: ConsolidadorResumen | null = null;
  isLoadingResumen = false;
  busquedaAtrasos = '';

  constructor(
    private dashboardService: DashboardService,
    private consolidadoService: ConsolidadoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
    this.cargarHistorico();
    this.authService.getAllUsers().subscribe({
      next: (users) => { this.usuarios = users; },
      error: () => {}
    });
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

  cargarHistorico(): void {
    this.isLoadingHistorico = true;
    this.consolidadoService.obtenerCerradosGDC().subscribe({
      next: (data) => {
        this.historico = data;
        this.isLoadingHistorico = false;
      },
      error: (error) => {
        console.error('Error al cargar histórico:', error);
        this.isLoadingHistorico = false;
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

  onSeleccionarConsolidador(): void {
    if (!this.usernameSeleccionado) {
      this.resumenConsolidador = null;
      return;
    }
    this.isLoadingResumen = true;
    this.resumenConsolidador = null;
    this.dashboardService.getResumenConsolidador(this.usernameSeleccionado).subscribe({
      next: (data) => {
        this.resumenConsolidador = data;
        this.isLoadingResumen = false;
      },
      error: () => { this.isLoadingResumen = false; }
    });
  }

  getBadgeEstado(estado: string): string {
    const map: Record<string, string> = {
      ASIGNADO: 'badge-primary', EN_PROCESO: 'badge-warning',
      PENDIENTE: 'badge-warning', GDC: 'badge-secondary', CERRADO: 'badge-success'
    };
    return map[estado] || 'badge-secondary';
  }

  getLabelEstado(estado: string): string {
    const map: Record<string, string> = {
      ASIGNADO: 'Asignado', EN_PROCESO: 'En proceso',
      PENDIENTE: 'Pendiente', GDC: 'En GDC', CERRADO: 'Cerrado'
    };
    return map[estado] || estado;
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

  verConsolidados(): void {
    this.router.navigate(['/consolidados']);
  }

  verCafeConJesus(): void {
    this.router.navigate(['/cafe-con-jesus']);
  }

  verDetalle(id: number): void {
    this.router.navigate(['/consolidados', id]);
  }
}
