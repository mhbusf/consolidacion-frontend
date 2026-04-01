import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  CafeConJesusService,
  CafeConJesusResponse,
} from '../../../core/services/cafe-con-jesus.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cafe-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="header">
        <h2>Cafe con Jesus</h2>
        <button class="btn-primary" (click)="nuevoRegistro()">
          + Nuevo Ingreso
        </button>
      </div>

      <div *ngIf="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Cargando registros...</p>
      </div>

      <div *ngIf="!isLoading && registros.length === 0" class="empty-state">
        <div class="empty-icon">☕</div>
        <h3>Sin registros</h3>
        <p>Aun no hay registros de Cafe con Jesus.</p>
        <button class="btn-primary" (click)="nuevoRegistro()">
          + Crear primer registro
        </button>
      </div>

      <div class="table-container" *ngIf="!isLoading && registros.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Telefono</th>
              <th>Fecha Ingreso</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of registros">
              <td class="fw-bold">{{ r.nombre }}</td>
              <td>{{ r.apellido }}</td>
              <td>{{ r.telefono }}</td>
              <td>{{ r.fechaIngreso | date : 'dd/MM/yyyy' }}</td>
              <td>
                <span class="user-badge">{{ r.registradoPor }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 1200px;
        margin: 40px auto;
        padding: 20px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      h2 {
        color: var(--text-primary);
        font-size: 28px;
        font-weight: 700;
      }

      .btn-primary {
        background: var(--primary-light);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .table-container {
        background: var(--bg-card);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-color);
      }

      .data-table {
        width: 100%;
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

      .data-table tbody tr {
        transition: background 0.2s;
      }

      .data-table tbody tr:hover {
        background: var(--bg-hover);
      }

      .data-table tbody tr:last-child td {
        border-bottom: none;
      }

      .fw-bold {
        font-weight: 600;
      }

      .user-badge {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px 20px;
        color: var(--text-secondary);
      }

      .spinner {
        width: 40px;
        height: 40px;
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

      .empty-state {
        text-align: center;
        padding: 60px 20px;
      }

      .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .empty-state h3 {
        color: var(--text-primary);
        font-size: 22px;
        margin-bottom: 8px;
      }

      .empty-state p {
        color: var(--text-secondary);
        margin-bottom: 20px;
      }
    `,
  ],
})
export class CafeListComponent implements OnInit {
  registros: CafeConJesusResponse[] = [];
  isLoading = true;
  isAdmin = false;

  constructor(
    private cafeService: CafeConJesusService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.cargarRegistros();
  }

  cargarRegistros(): void {
    this.isLoading = true;
    const obs$ = this.isAdmin
      ? this.cafeService.listarTodos()
      : this.cafeService.listarMios();

    obs$.subscribe({
      next: (data) => {
        this.registros = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar registros:', error);
        this.isLoading = false;
      },
    });
  }

  nuevoRegistro(): void {
    this.router.navigate(['/cafe-con-jesus/nuevo']);
  }
}
