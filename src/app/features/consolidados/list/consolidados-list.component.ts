import { Component, OnInit } from '@angular/core';
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
        <h2>Consolidados</h2>
        <div class="header-actions">
          <button class="btn-primary" (click)="crearNuevo()">+ Nuevo Consolidado</button>
        </div>
      </div>

      <!-- Filtros solo para Admin -->
      <div class="filters" *ngIf="isAdmin">
        <div class="filter-group">
          <label>Filtrar por:</label>
          <select [(ngModel)]="filtroSeleccionado" (change)="aplicarFiltro()" class="form-control">
            <option value="todos">Todos los consolidados</option>
            <option value="sin-asignar">Sin asignar</option>
            <option value="por-usuario">Por usuario específico</option>
            <option value="mis-consolidados">Mis consolidados creados</option>
          </select>
        </div>

        <div class="filter-group" *ngIf="filtroSeleccionado === 'por-usuario'">
          <label>Usuario:</label>
          <select [(ngModel)]="usuarioFiltro" (change)="filtrarPorUsuario()" class="form-control">
            <option value="">Seleccione un usuario</option>
            <option *ngFor="let user of usuarios" [value]="user.username">
              {{ user.username }} ({{ user.email }})
            </option>
          </select>
        </div>

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
        </div>
      </div>

      <div *ngIf="isLoading" class="loading">
        Cargando consolidados...
      </div>

      <div *ngIf="!isLoading && consolidados.length === 0" class="empty-state">
        <p>No hay consolidados {{ filtroTexto }}</p>
      </div>

      <div class="consolidados-grid" *ngIf="!isLoading && consolidados.length > 0">
        <div class="consolidado-card" *ngFor="let c of consolidados">
          <div class="card-header">
            <h3>{{ c.nombre }}</h3>
            <div class="badges">
              <span class="badge" *ngIf="c.usuarioAsignado">
                Asignado a: {{ c.usuarioAsignado }}
              </span>
              <span class="badge badge-warning" *ngIf="!c.usuarioAsignado">
                Sin asignar
              </span>
            </div>
          </div>

          <div class="card-body">
            <p><strong>Teléfono:</strong> {{ c.telefono }}</p>
            <p><strong>Edad:</strong> {{ c.edad }} años</p>
            <p><strong>Invitado por:</strong> {{ c.quienInvito }}</p>
            <p><strong>Motivo:</strong> {{ c.motivoOracion }}</p>
            <p class="meta">
              <small>Reportado por: {{ c.usuarioReporta }}</small>
            </p>
            <p class="meta">
              <small>Fecha: {{ c.fechaIngreso | date:'dd/MM/yyyy HH:mm' }}</small>
            </p>
          </div>

          <div class="card-actions">
            <button class="btn-secondary" (click)="verDetalle(c.id)">
              Ver Detalle
            </button>
            <button 
              *ngIf="isAdmin && !c.usuarioAsignado" 
              class="btn-success" 
              (click)="asignar(c.id)">
              Asignar
            </button>
            <button 
              *ngIf="isAdmin && c.usuarioAsignado" 
              class="btn-info" 
              (click)="reasignar(c.id)">
              Reasignar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
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
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .filter-group {
      margin-bottom: 15px;
    }

    .filter-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }

    .form-control {
      width: 100%;
      max-width: 400px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    .stat-number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .consolidados-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .consolidado-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .consolidado-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .card-header {
      background: #f8f9fa;
      padding: 15px;
      border-bottom: 1px solid #dee2e6;
    }

    .card-header h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .badges {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      background: #28a745;
      color: white;
      border-radius: 4px;
      font-size: 12px;
    }

    .badge-warning {
      background: #ffc107;
      color: #333;
    }

    .card-body {
      padding: 15px;
    }

    .card-body p {
      margin: 8px 0;
      color: #555;
    }

    .meta {
      color: #999;
      font-style: italic;
      margin-top: 10px;
    }

    .card-actions {
      padding: 15px;
      border-top: 1px solid #dee2e6;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary, .btn-success, .btn-info {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-info {
      background: #17a2b8;
      color: white;
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
  
  filtroSeleccionado = 'todos';
  usuarioFiltro = '';
  
  totalConsolidados = 0;
  sinAsignar = 0;

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
        next: (users) => {
          this.usuarios = users;
        },
        error: (error) => {
          console.error('Error al cargar usuarios', error);
        }
      });
    }
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
        c => c.usuarioAsignado === this.usuarioFiltro || c.usuarioReporta === this.usuarioFiltro
      );
    }
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