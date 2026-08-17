import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConsolidadoResponse } from '../../../core/models/consolidado.model';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-consolidados-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h2>{{ vistaHistorico ? 'Histórico de cierres' : 'Consolidados' }}</h2>
        <div class="header-actions">
          @if (isAdmin && vistaHistorico) {
            <button class="btn-secondary" (click)="volverActivos()">← Volver a Activos</button>
          }
          @if (!vistaHistorico) {
            <button class="btn-primary" (click)="crearNuevo()">+ Nuevo Consolidado</button>
          }
        </div>
      </div>
    
      <!-- Filtros solo para Admin (vista activos) -->
      @if (isAdmin && !vistaHistorico) {
        <div class="filters">
          <div class="filter-group">
            <label>Filtrar por:</label>
            <select [(ngModel)]="filtroSeleccionado" (change)="aplicarFiltro()" class="form-control">
              <option value="todos">Todos los consolidados</option>
              <option value="sin-asignar">Sin asignar</option>
              <option value="por-usuario">Por usuario específico</option>
              <option value="por-quien-asigno">Por quien asignó</option>
              <option value="mis-consolidados">Mis consolidados creados</option>
            </select>
          </div>
          @if (filtroSeleccionado === 'por-usuario' || filtroSeleccionado === 'por-quien-asigno') {
            <div class="filter-group">
              <label>{{ filtroSeleccionado === 'por-quien-asigno' ? 'Asignado por:' : 'Usuario:' }}</label>
              <select [(ngModel)]="usuarioFiltro" (change)="filtrarPorUsuario()" class="form-control">
                <option value="">Seleccione un usuario</option>
                @for (user of usuarios; track user) {
                  <option [value]="user.username">
                    {{ user.username }} ({{ user.email }})
                  </option>
                }
              </select>
            </div>
          }
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">{{ consolidados.length }}</div>
              <div class="stat-label">Total Mostrados</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ totalConsolidados }}</div>
              <div class="stat-label">Total activos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ sinAsignar }}</div>
              <div class="stat-label">Sin Asignar</div>
            </div>
            <button
              type="button"
              class="stat-card stat-card-history"
              aria-label="Ver histórico de cierres"
              (click)="verHistorico()">
              <div class="stat-number">{{ totalCerrados }}</div>
              <div class="stat-label">Histórico de cierres</div>
              <div class="stat-hint">Click para ver</div>
            </button>
          </div>
        </div>
      }
    
      @if (isLoading) {
        <div class="loading">
          {{ vistaHistorico ? 'Cargando histórico de cierres...' : 'Cargando consolidados...' }}
        </div>
      }

      @if (!isLoading && errorCarga) {
        <div class="error-state">
          <p>{{ errorCarga }}</p>
          <button type="button" class="btn-secondary" (click)="vistaHistorico ? cargarHistorico() : cargarDatos()">
            Reintentar
          </button>
        </div>
      }
    
      @if (!isLoading && !errorCarga && consolidados.length === 0) {
        <div class="empty-state">
          <p>No hay consolidados {{ filtroTexto }}</p>
        </div>
      }
     
      @if (!isLoading && !errorCarga && consolidados.length > 0) {
        <div class="advanced-filters">
          <div class="filter-field filter-field-search">
            <label>Buscar</label>
            <input
              type="search"
              [(ngModel)]="busqueda"
              class="form-control"
              placeholder="Nombre, telefono, invitado, asignado, asignó, motivo..."
            />
          </div>

          <div class="filter-field">
            <label>{{ vistaHistorico ? 'Tipo de cierre' : 'Estado' }}</label>
            <select [(ngModel)]="estadoFiltro" class="form-control">
              <option value="todos">Todos</option>
              @for (estado of estadosDisponibles; track estado) {
                <option [value]="estado">{{ getEstadoLabel(estado) }}</option>
              }
            </select>
          </div>

          @if (!vistaHistorico) {
            <div class="filter-field">
              <label>Asignación</label>
              <select [(ngModel)]="asignacionFiltro" class="form-control">
                <option value="todos">Todos</option>
                <option value="asignados">Asignados</option>
                <option value="sin-asignar">Sin asignar</option>
                <option value="mis-asignados">Asignados a mí</option>
                <option value="reportados-por-mi">Reportados por mí</option>
              </select>
            </div>
          }

          @if (isAdmin && !vistaHistorico) {
            <div class="filter-field">
              <label>Usuario</label>
              <select [(ngModel)]="usuarioAvanzadoFiltro" class="form-control">
                <option value="todos">Todos</option>
                @for (user of usuarios; track user.username) {
                  <option [value]="user.username">{{ user.username }}</option>
                }
              </select>
            </div>
          }

          <div class="filter-field">
            <label>{{ vistaHistorico ? 'Fecha de cierre' : 'Fecha' }}</label>
            <select [(ngModel)]="fechaFiltro" class="form-control">
              <option value="todos">Todas</option>
              <option value="hoy">Hoy</option>
              <option value="7-dias">Últimos 7 días</option>
              <option value="30-dias">Últimos 30 días</option>
              <option value="90-dias">Últimos 90 días</option>
            </select>
          </div>

          <div class="filter-actions">
            <div class="results-count">{{ consolidadosFiltrados.length }} de {{ consolidados.length }}</div>
            <button class="btn-secondary" type="button" (click)="limpiarFiltrosAvanzados()">Limpiar</button>
          </div>
        </div>

        @if (consolidadosFiltrados.length === 0) {
          <div class="empty-state">
            <p>No hay resultados con los filtros seleccionados.</p>
          </div>
        }

        @if (consolidadosFiltrados.length > 0) {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Edad</th>
                  <th>Quién invitó</th>
                  <th>Motivo</th>
                  <th>Fecha ingreso</th>
                  <th>Reportado por</th>
                  <th>Asignado por</th>
                  @if (vistaHistorico) {
                    <th>Tipo de cierre</th>
                    <th>GDC</th>
                    <th>Fecha cierre</th>
                    <th>Comentario cierre</th>
                  }
                  @if (!vistaHistorico) {
                    <th>Asignado a</th>
                    <th>Estado</th>
                  }
                  <th>3 semanas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (c of consolidadosFiltrados; track c.id) {
                  <tr>
                    <td data-label="Nombre" class="fw-bold nombre-link" (click)="verDetalle(c.id)">{{ c.nombre }}</td>
                    <td data-label="Teléfono">{{ c.telefono }}</td>
                    <td data-label="Edad">{{ c.edad || '-' }}</td>
                    <td data-label="Quién invitó">{{ c.quienInvito || '—' }}</td>
                    <td data-label="Motivo" class="comentario-cell">{{ c.motivoOracion || '—' }}</td>
                    <td data-label="Fecha ingreso">{{ c.fechaIngreso | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td data-label="Reportado por">{{ c.usuarioReporta || '—' }}</td>
                    <td data-label="Asignado por">{{ c.usuarioAsigno || '—' }}</td>
                    @if (vistaHistorico) {
                      <td data-label="Tipo de cierre">
                        <span class="badge" [ngClass]="getTipoCierreClass(c.estado)">
                          {{ getTipoCierreLabel(c.estado) }}
                        </span>
                      </td>
                      <td data-label="GDC">
                        @if (c.estado === 'GDC') {
                          <span class="badge badge-gdc">{{ c.gdc || 'No registrado' }}</span>
                        } @else {
                          <span class="text-muted">No aplica</span>
                        }
                      </td>
                      <td data-label="Fecha de cierre">
                        {{ c.fechaCierre ? (c.fechaCierre | date:'dd/MM/yyyy HH:mm') : '—' }}
                      </td>
                      <td data-label="Comentario de cierre" class="comentario-cell">
                        {{ c.comentarioCierre || '—' }}
                      </td>
                    }
                    @if (!vistaHistorico) {
                      <td data-label="Asignado a">
                        @if (c.usuarioAsignado) {
                          <span class="user-badge">{{ c.usuarioAsignado }}</span>
                        } @else {
                          <span class="badge badge-warning">Sin asignar</span>
                        }
                      </td>
                      <td data-label="Estado">
                        <span class="badge" [ngClass]="getEstadoClass(c.estado)">{{ getEstadoLabel(c.estado) }}</span>
                      </td>
                    }
                    <td data-label="3 semanas">
                      <span class="badge" [ngClass]="c.hitoTresSemanasCumplido ? 'badge-success' : 'badge-secondary'">
                        {{ c.hitoTresSemanasCumplido ? 'Cumplido' : 'Pendiente' }}
                      </span>
                    </td>
                    <td data-label="Acciones" class="actions-cell">
                      <div class="row-actions">
                        <button class="btn-secondary" (click)="verDetalle(c.id)">Ver</button>
                        @if (isAdmin && !vistaHistorico && !c.usuarioAsignado) {
                          <button class="btn-success" (click)="asignar(c.id)">Asignar</button>
                        }
                        @if (isAdmin && !vistaHistorico && c.usuarioAsignado) {
                          <button class="btn-info" (click)="reasignar(c.id)">Reasignar</button>
                        }
                      </div>
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
    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 34px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .header h2 {
      color: #132033;
      font-size: 32px;
      font-weight: 950;
      letter-spacing: -1px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .filters {
      background: #ffffff;
      padding: 22px;
      border-radius: 24px;
      border: 1px solid #dce5ef;
      margin-bottom: 30px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    }

    .filter-group {
      margin-bottom: 15px;
    }

    .filter-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 850;
      color: #334155;
    }

    .form-control {
      width: 100%;
      max-width: 400px;
      min-height: 46px;
      padding: 12px 14px;
      border: 1px solid #d7e0ea;
      border-radius: 14px;
      font-size: 14px;
      box-sizing: border-box;
      background: #ffffff;
      color: #132033;
    }

    .advanced-filters {
      display: grid;
      grid-template-columns: minmax(260px, 2fr) repeat(4, minmax(160px, 1fr)) auto;
      gap: 14px;
      align-items: end;
      background: #ffffff;
      border: 1px solid #dce5ef;
      border-radius: 24px;
      padding: 18px;
      margin-bottom: 16px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    }

    .filter-field label {
      display: block;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .filter-field .form-control {
      max-width: none;
    }

    .filter-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: flex-end;
      min-width: 150px;
    }

    .results-count {
      color: #64748b;
      font-size: 13px;
      font-weight: 850;
      white-space: nowrap;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }

    .stat-card {
      background: #f8fafc;
      color: #132033;
      font: inherit;
      width: 100%;
      padding: 20px;
      border-radius: 20px;
      text-align: center;
      border: 1px solid #dce5ef;
      box-shadow: 0 12px 26px rgba(15, 23, 42, 0.04);
    }

    .stat-number {
      font-size: 32px;
      font-weight: 950;
      margin-bottom: 5px;
      color: #1d4ed8;
      letter-spacing: -1px;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
      font-weight: 850;
    }

    .loading, .empty-state, .error-state {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }

    .error-state p {
      margin-bottom: 12px;
      color: var(--danger);
    }

    .table-container {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #dce5ef;
      overflow-x: auto;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    }

    .data-table {
      width: 100%;
      min-width: 1200px;
      border-collapse: collapse;
    }

    .data-table thead {
      background: #f8fafc;
    }

    .data-table th {
      padding: 15px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 15px 16px;
      color: #132033;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table tbody tr:hover {
      background: #eff6ff;
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .fw-bold { font-weight: 850; }

    .nombre-link {
      cursor: pointer;
      color: #1d4ed8;
      text-decoration: none;
    }

    .user-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #1d4ed8;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .comentario-cell {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border: 1px solid var(--success);
      border-radius: 999px;
      font-size: 12px;
    }

    .badge-warning {
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning);
      border: 1px solid var(--warning);
    }

    .badge-primary {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border: 1px solid #3b82f6;
    }

    .badge-secondary {
      background: rgba(100, 116, 139, 0.1);
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .badge-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid #ef4444;
    }

    .badge-gdc {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      border: 1px solid #8b5cf6;
    }

    .badge-closed {
      background: rgba(71, 85, 105, 0.1);
      color: #334155;
      border: 1px solid #64748b;
    }

    .stat-card-history {
      cursor: pointer;
      border-color: #8b5cf6;
      transition: background 0.2s, transform 0.2s;
    }

    .stat-card-history:hover {
      background: #f5f3ff;
      transform: translateY(-2px);
    }

    .stat-card-history .stat-number {
      color: #8b5cf6;
    }

    .stat-hint {
      font-size: 11px;
      color: #8b5cf6;
      margin-top: 4px;
      opacity: 0.8;
    }

    .row-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .btn-primary, .btn-secondary, .btn-success, .btn-info {
      padding: 10px 16px;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s;
      font-weight: 900;
    }

    .btn-primary {
      background: linear-gradient(135deg, #1d4ed8, #0f172a);
      color: white;
    }

    .btn-secondary {
      background: #edf2f7;
      color: #334155;
    }

    .btn-success {
      background: var(--success);
      color: white;
    }

    .btn-info {
      background: var(--info);
      color: white;
    }

    button:hover {
      opacity: 0.9;
    }

    @media (max-width: 1100px) {
      .advanced-filters {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .filter-field-search,
      .filter-actions {
        grid-column: 1 / -1;
      }

      .filter-actions {
        justify-content: space-between;
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 18px 12px 28px;
      }

      .header {
        align-items: stretch;
        margin-bottom: 18px;
      }

      .header h2 {
        font-size: 27px;
      }

      .header-actions,
      .header-actions button {
        width: 100%;
      }

      .filters {
        padding: 16px;
        margin-bottom: 18px;
        border-radius: 18px;
      }

      .form-control {
        max-width: none;
      }

      .stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .stat-card {
        padding: 14px 8px;
        border-radius: 16px;
      }

      .stat-number {
        font-size: 25px;
      }

      .table-container {
        overflow: visible;
        background: transparent;
        border: none;
        border-radius: 0;
        box-shadow: none;
      }

      .data-table {
        display: block;
        min-width: 0;
      }

      .data-table thead {
        display: none;
      }

      .data-table tbody {
        display: grid;
        gap: 14px;
      }

      .data-table tbody tr {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #ffffff;
        border: 1px solid #dce5ef;
        border-radius: 20px;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
      }

      .data-table tbody tr:hover {
        background: #ffffff;
      }

      .data-table td {
        display: grid;
        grid-template-columns: minmax(100px, 0.45fr) minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        padding: 10px 14px;
        overflow-wrap: anywhere;
      }

      .data-table tbody tr:last-child td {
        border-bottom: 1px solid #e2e8f0;
      }

      .data-table td::before {
        content: attr(data-label);
        color: #64748b;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .data-table .nombre-link {
        order: -2;
        padding-top: 14px;
        padding-bottom: 14px;
        background: #eff6ff;
        border-bottom: 1px solid #dbeafe;
        font-size: 16px;
      }

      .data-table .actions-cell {
        order: -1;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }

      .data-table td[data-label="3 semanas"] {
        border-bottom: none;
      }

      .data-table td[data-label="Comentario de cierre"] {
        border-bottom: none;
      }

      .comentario-cell {
        max-width: none;
        overflow: visible;
        text-overflow: clip;
        white-space: normal;
      }

      .row-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        width: 100%;
        gap: 8px;
      }

      .row-actions button {
        width: 100%;
        min-height: 44px;
      }
    }

    @media (max-width: 640px) {
      .advanced-filters {
        grid-template-columns: 1fr;
      }

      .filter-field-search,
      .filter-actions {
        grid-column: auto;
      }
    }
  `]
})
export class ConsolidadosListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  consolidados: ConsolidadoResponse[] = [];
  consolidadosTodos: ConsolidadoResponse[] = [];
  usuarios: User[] = [];
  isLoading = true;
  isAdmin = false;
  currentUsername = '';
  vistaHistorico = false;

  filtroSeleccionado = 'todos';
  usuarioFiltro = '';
  busqueda = '';
  estadoFiltro = 'todos';
  asignacionFiltro = 'todos';
  usuarioAvanzadoFiltro = 'todos';
  fechaFiltro = 'todos';

  totalConsolidados = 0;
  sinAsignar = 0;
  totalCerrados = 0;
  errorCarga = '';

  constructor(
    private consolidadoService: ConsolidadoService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.isAdmin = user?.roles.some(role => role.name === 'ROLE_ADMIN') ?? false;
        this.currentUsername = user?.username ?? '';
      });
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (this.isAdmin && params.get('vista') === 'historico') {
          const tipo = params.get('tipo');
          this.estadoFiltro = tipo === 'GDC' || tipo === 'CERRADO' ? tipo : 'todos';
          this.busqueda = params.get('busqueda') || '';
          this.fechaFiltro = params.get('fecha') || 'todos';
          this.cargarHistorico();
          return;
        }

        this.cargarDatos();
      });
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.vistaHistorico = false;
    this.errorCarga = '';

    this.consolidadoService.obtenerTodos().subscribe({
      next: (data) => {
        this.consolidadosTodos = data;
        this.consolidados = data;
        this.totalConsolidados = data.length;
        this.sinAsignar = data.filter(c => !c.usuarioAsignado).length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar consolidados', error);
        this.errorCarga = error?.error?.message || 'No fue posible cargar los consolidados.';
        this.isLoading = false;
      }
    });

    if (this.isAdmin) {
      this.authService.getAllUsers().subscribe({
        next: (users) => { this.usuarios = users; },
        error: (error) => { console.error('Error al cargar usuarios', error); }
      });

      this.consolidadoService.obtenerCerrados().subscribe({
        next: (data) => { this.totalCerrados = data.length; },
        error: () => { this.totalCerrados = 0; }
      });
    }
  }

  verHistorico(): void {
    this.limpiarFiltrosAvanzados();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { vista: 'historico', tipo: null, busqueda: null, fecha: null },
      queryParamsHandling: 'merge',
    });
  }

  cargarHistorico(): void {
    this.isLoading = true;
    this.vistaHistorico = true;
    this.errorCarga = '';
    this.consolidadoService.obtenerCerrados().subscribe({
      next: (data) => {
        this.consolidados = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.consolidados = [];
        console.error('Error al cargar el histórico de cierres', error);
        this.errorCarga = error?.error?.message || 'No fue posible cargar el histórico de cierres.';
        this.isLoading = false;
      }
    });
  }

  volverActivos(): void {
    this.filtroSeleccionado = 'todos';
    this.usuarioFiltro = '';
    this.limpiarFiltrosAvanzados();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { vista: null, tipo: null, busqueda: null, fecha: null },
      queryParamsHandling: 'merge',
    });
  }

  aplicarFiltro(): void {
    switch (this.filtroSeleccionado) {
      case 'todos':
        this.consolidados = this.consolidadosTodos;
        break;
      case 'sin-asignar':
        this.consolidados = this.consolidadosTodos.filter(c => !c.usuarioAsignado);
        break;
      case 'mis-consolidados':
        this.consolidados = this.consolidadosTodos.filter(c => c.usuarioReporta === this.currentUsername);
        break;
      case 'por-usuario':
        if (!this.usuarioFiltro) {
          this.consolidados = [];
        }
        break;
      case 'por-quien-asigno':
        if (!this.usuarioFiltro) {
          this.consolidados = [];
        }
        break;
    }
  }

  filtrarPorUsuario(): void {
    if (this.usuarioFiltro) {
      if (this.filtroSeleccionado === 'por-quien-asigno') {
        this.consolidados = this.consolidadosTodos.filter(c => c.usuarioAsigno === this.usuarioFiltro);
        return;
      }

      this.consolidados = this.consolidadosTodos.filter(
        c => c.usuarioAsignado === this.usuarioFiltro || c.usuarioReporta === this.usuarioFiltro
      );
    }
  }

  get estadosDisponibles(): string[] {
    const estados = this.consolidados
      .map(c => c.estado)
      .filter((estado): estado is string => !!estado);
    return [...new Set(estados)].sort();
  }

  get consolidadosFiltrados(): ConsolidadoResponse[] {
    const term = this.busqueda.trim().toLowerCase();

    return this.consolidados.filter(c => {
      const matchesText = !term || [
        c.nombre,
        c.telefono,
        c.edad?.toString(),
        c.quienInvito,
        c.motivoOracion,
        c.usuarioReporta,
        c.usuarioAsignado,
        c.usuarioAsigno,
        c.estado,
        c.gdc,
        c.comentarioCierre,
        c.fechaIngreso,
        c.fechaCierre,
      ].some(value => (value || '').toLowerCase().includes(term));

      const matchesEstado = this.estadoFiltro === 'todos' || c.estado === this.estadoFiltro;
      const matchesAsignacion = this.matchesAsignacion(c);
      const matchesUsuario = this.usuarioAvanzadoFiltro === 'todos' ||
        c.usuarioAsignado === this.usuarioAvanzadoFiltro ||
        c.usuarioReporta === this.usuarioAvanzadoFiltro ||
        c.usuarioAsigno === this.usuarioAvanzadoFiltro;
      const matchesFecha = this.matchesFecha(this.vistaHistorico ? c.fechaCierre : c.fechaIngreso);

      return matchesText && matchesEstado && matchesAsignacion && matchesUsuario && matchesFecha;
    });
  }

  limpiarFiltrosAvanzados(): void {
    this.busqueda = '';
    this.estadoFiltro = 'todos';
    this.asignacionFiltro = 'todos';
    this.usuarioAvanzadoFiltro = 'todos';
    this.fechaFiltro = 'todos';
  }

  getEstadoLabel(estado?: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      ASIGNADO: 'Asignado',
      EN_PROCESO: 'En proceso',
      GDC: 'Cerrado con GDC',
      CERRADO: 'Cerrado sin GDC',
    };
    return estado ? labels[estado] || estado : '—';
  }

  getEstadoClass(estado?: string): string {
    const classes: Record<string, string> = {
      PENDIENTE: 'badge-warning',
      ASIGNADO: 'badge-primary',
      EN_PROCESO: 'badge-warning',
      GDC: 'badge-secondary',
      CERRADO: 'badge-success',
    };
    return estado ? classes[estado] || 'badge-secondary' : 'badge-secondary';
  }

  getTipoCierreLabel(estado?: string): string {
    if (estado === 'GDC') return 'GDC';
    if (estado === 'CERRADO') return 'Cierre sin GDC';
    return '—';
  }

  getTipoCierreClass(estado?: string): string {
    return estado === 'GDC' ? 'badge-gdc' : 'badge-closed';
  }

  private matchesAsignacion(c: ConsolidadoResponse): boolean {
    switch (this.asignacionFiltro) {
      case 'asignados':
        return !!c.usuarioAsignado;
      case 'sin-asignar':
        return !c.usuarioAsignado;
      case 'mis-asignados':
        return c.usuarioAsignado === this.currentUsername;
      case 'reportados-por-mi':
        return c.usuarioReporta === this.currentUsername;
      default:
        return true;
    }
  }

  private matchesFecha(fechaValor?: string | null): boolean {
    if (this.fechaFiltro === 'todos') return true;
    if (!fechaValor) return false;

    const fecha = new Date(fechaValor);
    if (Number.isNaN(fecha.getTime())) return false;

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioManana = new Date(inicioHoy);
    inicioManana.setDate(inicioManana.getDate() + 1);

    if (this.fechaFiltro === 'hoy') {
      return fecha >= inicioHoy && fecha < inicioManana;
    }

    const dias = this.fechaFiltro === '7-dias' ? 7 : this.fechaFiltro === '30-dias' ? 30 : 90;
    const limite = new Date(inicioHoy);
    limite.setDate(limite.getDate() - (dias - 1));
    return fecha >= limite && fecha < inicioManana;
  }

  get filtroTexto(): string {
    if (this.vistaHistorico) return 'en el histórico de cierres';

    switch (this.filtroSeleccionado) {
      case 'sin-asignar': return 'sin asignar';
      case 'mis-consolidados': return 'creados por ti';
      case 'por-usuario': return `para el usuario ${this.usuarioFiltro || 'seleccionado'}`;
      case 'por-quien-asigno': return `asignados por ${this.usuarioFiltro || 'el usuario seleccionado'}`;
      default: return '';
    }
  }

  verDetalle(id: number): void {
    this.router.navigate(['/consolidados', id], {
      queryParams: this.vistaHistorico ? {
        origen: 'historico',
        tipo: this.estadoFiltro !== 'todos' ? this.estadoFiltro : undefined,
        busqueda: this.busqueda || undefined,
        fecha: this.fechaFiltro !== 'todos' ? this.fechaFiltro : undefined,
      } : undefined,
    });
  }

  crearNuevo(): void {
    this.router.navigate(['/consolidados/nuevo']);
  }

  asignar(id: number): void {
    this.router.navigate(['/consolidados', id, 'asignar']);
  }

  reasignar(id: number): void {
    this.router.navigate(['/consolidados', id, 'asignar']);
  }
}
