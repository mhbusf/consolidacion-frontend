import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
        <h2>{{ vistaGDC ? 'Consolidados Cerrados con GDC' : 'Consolidados' }}</h2>
        <div class="header-actions">
          @if (isAdmin && vistaGDC) {
            <button class="btn-secondary" (click)="volverActivos()">← Volver a Activos</button>
          }
          @if (!vistaGDC) {
            <button class="btn-primary" (click)="crearNuevo()">+ Nuevo Consolidado</button>
          }
        </div>
      </div>
    
      <!-- Filtros solo para Admin (vista activos) -->
      @if (isAdmin && !vistaGDC) {
        <div class="filters">
          <div class="filter-group">
            <label>Filtrar por:</label>
            <select [(ngModel)]="filtroSeleccionado" (change)="aplicarFiltro()" class="form-control">
              <option value="todos">Todos los consolidados</option>
              <option value="sin-asignar">Sin asignar</option>
              <option value="por-usuario">Por usuario específico</option>
              <option value="mis-consolidados">Mis consolidados creados</option>
            </select>
          </div>
          @if (filtroSeleccionado === 'por-usuario') {
            <div class="filter-group">
              <label>Usuario:</label>
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
              <div class="stat-label">Total General</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ sinAsignar }}</div>
              <div class="stat-label">Sin Asignar</div>
            </div>
            <div class="stat-card stat-card-gdc" (click)="verCerradosGDC()">
              <div class="stat-number">{{ totalCerradosGDC }}</div>
              <div class="stat-label">Cerrados con GDC</div>
              <div class="stat-hint">Click para ver</div>
            </div>
          </div>
        </div>
      }
    
      @if (isLoading) {
        <div class="loading">
          Cargando consolidados...
        </div>
      }
    
      @if (!isLoading && consolidados.length === 0) {
        <div class="empty-state">
          <p>No hay consolidados {{ filtroTexto }}</p>
        </div>
      }
     
      @if (!isLoading && consolidados.length > 0) {
        <div class="search-bar">
          <input
            type="search"
            [(ngModel)]="busqueda"
            class="form-control search-input"
            placeholder="Buscar por nombre, telefono, invitado, asignado o estado..."
          />
        </div>

        @if (consolidadosFiltrados.length === 0) {
          <div class="empty-state">
            <p>No hay resultados para "{{ busqueda }}".</p>
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
                  <th>{{ vistaGDC ? 'GDC' : 'Asignado a' }}</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (c of consolidadosFiltrados; track c) {
                  <tr>
                    <td class="fw-bold nombre-link" (click)="verDetalle(c.id)">{{ c.nombre }}</td>
                    <td>{{ c.telefono }}</td>
                    <td>{{ c.edad || '-' }}</td>
                    <td>{{ c.quienInvito || '—' }}</td>
                    <td class="comentario-cell">{{ c.motivoOracion || '—' }}</td>
                    <td>{{ c.fechaIngreso | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ c.usuarioReporta || '—' }}</td>
                    <td>
                      @if (vistaGDC) {
                        <span class="badge badge-gdc">{{ c.gdc || '—' }}</span>
                      }
                      @if (!vistaGDC && c.usuarioAsignado) {
                        <span class="user-badge">{{ c.usuarioAsignado }}</span>
                      }
                      @if (!vistaGDC && !c.usuarioAsignado) {
                        <span class="badge badge-warning">Sin asignar</span>
                      }
                    </td>
                    <td>
                      @if (vistaGDC && c.comentarioCierre) {
                        <span class="comentario-cell">{{ c.comentarioCierre }}</span>
                      }
                      @if (!vistaGDC) {
                        <span class="badge">{{ c.estado || '—' }}</span>
                      }
                    </td>
                    <td class="actions-cell">
                      <button class="btn-secondary" (click)="verDetalle(c.id)">Ver</button>
                      @if (isAdmin && !vistaGDC && !c.usuarioAsignado) {
                        <button class="btn-success" (click)="asignar(c.id)">Asignar</button>
                      }
                      @if (isAdmin && !vistaGDC && c.usuarioAsignado) {
                        <button class="btn-info" (click)="reasignar(c.id)">Reasignar</button>
                      }
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
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .filters {
      background: var(--bg-card);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-bottom: 30px;
    }

    .filter-group {
      margin-bottom: 15px;
    }

    .filter-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .form-control {
      width: 100%;
      max-width: 400px;
      padding: 10px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .search-bar {
      margin-bottom: 16px;
    }

    .search-input {
      max-width: 520px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }

    .stat-card {
      background: var(--bg-secondary);
      color: var(--text-primary);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid var(--border-color);
    }

    .stat-number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
      color: var(--primary-light);
    }

    .stat-label {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .loading, .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }

    .table-container {
      background: var(--bg-card);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      min-width: 1200px;
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

    .data-table tbody tr:hover {
      background: var(--bg-hover);
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .fw-bold { font-weight: 600; }

    .nombre-link {
      cursor: pointer;
      color: var(--primary-light);
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .user-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      padding: 4px 10px;
      border-radius: 10px;
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
      border-radius: 4px;
      font-size: 12px;
    }

    .badge-warning {
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning);
      border: 1px solid var(--warning);
    }

    .badge-gdc {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      border: 1px solid #8b5cf6;
    }

    .stat-card-gdc {
      cursor: pointer;
      border-color: #8b5cf6;
      transition: background 0.2s, transform 0.2s;
    }

    .stat-card-gdc:hover {
      background: rgba(139, 92, 246, 0.1);
      transform: translateY(-2px);
    }

    .stat-card-gdc .stat-number {
      color: #8b5cf6;
    }

    .stat-hint {
      font-size: 11px;
      color: #8b5cf6;
      margin-top: 4px;
      opacity: 0.8;
    }

    .actions-cell {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .btn-primary, .btn-secondary, .btn-success, .btn-info {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s;
      color: white;
    }

    .btn-primary {
      background: var(--primary-light);
    }

    .btn-secondary {
      background: var(--secondary);
    }

    .btn-success {
      background: var(--success);
    }

    .btn-info {
      background: var(--info);
    }

    button:hover {
      opacity: 0.9;
    }
  `]
})
export class ConsolidadosListComponent implements OnInit {
  consolidados: ConsolidadoResponse[] = [];
  consolidadosTodos: ConsolidadoResponse[] = [];
  usuarios: User[] = [];
  isLoading = true;
  isAdmin = false;
  currentUsername = '';
  vistaGDC = false;

  filtroSeleccionado = 'todos';
  usuarioFiltro = '';
  busqueda = '';

  totalConsolidados = 0;
  sinAsignar = 0;
  totalCerradosGDC = 0;

  constructor(
    private consolidadoService: ConsolidadoService,
    private authService: AuthService,
    private router: Router
  ) {
    this.isAdmin = this.authService.isAdmin();
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUsername = user.username;
      }
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.vistaGDC = false;

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
        this.isLoading = false;
      }
    });

    if (this.isAdmin) {
      this.authService.getAllUsers().subscribe({
        next: (users) => { this.usuarios = users; },
        error: (error) => { console.error('Error al cargar usuarios', error); }
      });

      this.consolidadoService.obtenerCerradosGDC().subscribe({
        next: (data) => { this.totalCerradosGDC = data.length; },
        error: () => { this.totalCerradosGDC = 0; }
      });
    }
  }

  verCerradosGDC(): void {
    this.isLoading = true;
    this.vistaGDC = true;
    this.consolidadoService.obtenerCerradosGDC().subscribe({
      next: (data) => {
        this.consolidados = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar cerrados GDC', error);
        this.isLoading = false;
      }
    });
  }

  volverActivos(): void {
    this.vistaGDC = false;
    this.filtroSeleccionado = 'todos';
    this.consolidados = this.consolidadosTodos;
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
    }
  }

  filtrarPorUsuario(): void {
    if (this.usuarioFiltro) {
      this.consolidados = this.consolidadosTodos.filter(
        c => c.usuarioAsignado === this.usuarioFiltro || 
     c.usuarioReporta === this.usuarioFiltro
    );
    }
  }

  get consolidadosFiltrados(): ConsolidadoResponse[] {
    const term = this.busqueda.trim().toLowerCase();
    if (!term) return this.consolidados;

    return this.consolidados.filter(c => [
      c.nombre,
      c.telefono,
      c.edad?.toString(),
      c.quienInvito,
      c.motivoOracion,
      c.usuarioReporta,
      c.usuarioAsignado,
      c.estado,
      c.gdc,
      c.comentarioCierre,
      c.fechaIngreso,
    ].some(value => (value || '').toLowerCase().includes(term)));
  }

  get filtroTexto(): string {
    switch (this.filtroSeleccionado) {
      case 'sin-asignar': return 'sin asignar';
      case 'mis-consolidados': return 'creados por ti';
      case 'por-usuario': return `para el usuario ${this.usuarioFiltro || 'seleccionado'}`;
      default: return '';
    }
  }

  verDetalle(id: number): void {
    this.router.navigate(['/consolidados', id]);
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
