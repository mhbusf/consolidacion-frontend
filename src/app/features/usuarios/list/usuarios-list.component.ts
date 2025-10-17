import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="header">
        <h2>Gestión de Usuarios</h2>
        <button class="btn-back" (click)="volver()">← Volver</button>
      </div>

      <div *ngIf="isLoading" class="loading">
        Cargando usuarios...
      </div>

      <div class="usuarios-table" *ngIf="!isLoading">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of usuarios">
              <td><strong>{{ user.username }}</strong></td>
              <td>{{ user.email }}</td>
              <td>
                <span class="badge" *ngFor="let role of user.roles">
                  {{ role.name.replace('ROLE_', '') }}
                </span>
              </td>
              <td>
                <span [class]="user.enabled ? 'status-active' : 'status-inactive'">
                  {{ user.enabled ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <button 
                  class="btn-small btn-primary"
                  (click)="asignarRol(user.username)"
                  *ngIf="!tieneRolAdmin(user)">
                  Hacer Admin
                </button>
                <button 
                  class="btn-small btn-danger"
                  (click)="eliminarUsuario(user.username)">
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 40px auto;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .btn-back {
      background: #6c757d;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .usuarios-table {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #f8f9fa;
    }

    th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #dee2e6;
    }

    td {
      padding: 15px;
      border-bottom: 1px solid #dee2e6;
    }

    tbody tr:hover {
      background: #f8f9fa;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      background: #007bff;
      color: white;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 5px;
    }

    .status-active {
      color: #28a745;
      font-weight: 500;
    }

    .status-inactive {
      color: #dc3545;
      font-weight: 500;
    }

    .btn-small {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      margin-right: 5px;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-small:hover {
      opacity: 0.9;
    }
  `]
})
export class UsuariosListComponent implements OnInit {
  usuarios: User[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.isLoading = true;
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios', error);
        this.isLoading = false;
      }
    });
  }

  tieneRolAdmin(user: User): boolean {
    return user.roles.some(r => r.name === 'ROLE_ADMIN');
  }

  asignarRol(username: string): void {
    if (confirm(`¿Asignar rol ADMIN a ${username}?`)) {
      this.authService.assignRole(username, 'ROLE_ADMIN').subscribe({
        next: () => {
          alert('Rol asignado correctamente');
          this.cargarUsuarios();
        },
        error: (error) => {
          alert('Error al asignar rol');
        }
      });
    }
  }

  eliminarUsuario(username: string): void {
    if (confirm(`¿Está seguro de eliminar al usuario ${username}?`)) {
      this.authService.deleteUser(username).subscribe({
        next: () => {
          alert('Usuario eliminado correctamente');
          this.cargarUsuarios();
        },
        error: (error) => {
          alert('Error al eliminar usuario');
        }
      });
    }
  }

  volver(): void {
    this.router.navigate(['/consolidados']);
  }
}