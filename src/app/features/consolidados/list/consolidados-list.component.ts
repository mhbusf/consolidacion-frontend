import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConsolidadoResponse } from '../../../core/models/consolidado.model';

@Component({
  selector: 'app-consolidados-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <div class="header">
        <h2>Consolidados</h2>
        <div class="header-actions">
          <button class="btn-logout" (click)="logout()">Cerrar Sesión</button>
          <button class="btn-primary" (click)="crearNuevo()">+ Nuevo Consolidado</button>
        </div>
      </div>

      <div *ngIf="isLoading" class="loading">
        Cargando consolidados...
      </div>

      <div *ngIf="!isLoading && consolidados.length === 0" class="empty-state">
        <p>No hay consolidados registrados</p>
      </div>

      <div class="consolidados-grid" *ngIf="!isLoading && consolidados.length > 0">
        <div class="consolidado-card" *ngFor="let c of consolidados">
          <div class="card-header">
            <h3>{{ c.nombre }}</h3>
            <span class="badge" *ngIf="c.usuarioAsignado">
              Asignado a: {{ c.usuarioAsignado }}
            </span>
            <span class="badge badge-warning" *ngIf="!c.usuarioAsignado">
              Sin asignar
            </span>
          </div>

          <div class="card-body">
            <p><strong>Teléfono:</strong> {{ c.telefono }}</p>
            <p><strong>Edad:</strong> {{ c.edad }} años</p>
            <p><strong>Invitado por:</strong> {{ c.quienInvito }}</p>
            <p><strong>Motivo:</strong> {{ c.motivoOracion }}</p>
            <p class="meta">
              <small>Reportado por: {{ c.usuarioReporta }}</small>
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
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
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
      transition: transform 0.2s;
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
    }

    .btn-primary, .btn-secondary, .btn-success, .btn-logout {
      padding: 10px 20px;
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

    .btn-logout {
      background: #dc3545;
      color: white;
    }

    button:hover {
      opacity: 0.9;
    }
  `]
})
export class ConsolidadosListComponent implements OnInit {
  consolidados: ConsolidadoResponse[] = [];
  isLoading = true;
  isAdmin = false;

  constructor(
    private consolidadoService: ConsolidadoService,
    private authService: AuthService,
    private router: Router
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.cargarConsolidados();
  }

  cargarConsolidados(): void {
    this.isLoading = true;
    this.consolidadoService.obtenerTodos().subscribe({
      next: (data) => {
        this.consolidados = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar consolidados', error);
        this.isLoading = false;
      }
    });
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}