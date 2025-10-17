import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="header">
        <h2>Gestión de Usuarios</h2>
        <div class="actions">
          <button class="btn-primary" (click)="crearUsuario()">+ Crear Usuario</button>
        </div>
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
              <th>Consolidados</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of usuariosConStats">
              <td><strong>{{ user.usuario.username }}</strong></td>
              <td>{{ user.usuario.email }}</td>
              <td>
                <span class="badge" *ngFor="let role of user.usuario.roles">
                  {{ role.name.replace('ROLE_', '') }}
                </span>
              </td>
              <td>
                <span [class]="user.usuario.enabled ? 'status-active' : 'status-inactive'">
                  {{ user.usuario.enabled ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="stats-mini">
                  <span class="stat-item" title="Creados">📝 {{ user.creados }}</span>
                  <span class="stat-item" title="Asignados">📌 {{ user.asignados }}</span>
                </div>
              </td>
              <td>
                <button 
                  class="btn-small btn-info"
                  (click)="verConsolidados(user.usuario.username)">
                  Ver Consolidados
                </button>
                <button 
                  class="btn-small btn-primary"
                  (click)="asignarRol(user.usuario.username)"
                  *ngIf="!tieneRolAdmin(user.usuario)">
                  Hacer Admin
                </button>
                <button 
                  class="btn-small btn-danger"
                  (click)="eliminarUsuario(user.usuario.username)">
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
      max-width: 1400px;
      margin: 40px auto;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .actions {
      display: flex;
      gap: 10px;
    }

    .btn-primary {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
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
      overflow-x: auto;
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

    .stats-mini {
      display: flex;
      gap: 10px;
    }

    .stat-item {
      font-size: 13px;
      color: #666;
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

    .btn-info {
      background: #17a2b8;
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
  usuariosConStats: any[] = [];
  consolidados: any[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private consolidadoService: ConsolidadoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading = true;
    
    // Cargar usuarios y consolidados
    Promise.all([
      this.authService.getAllUsers().toPromise(),
      this.consolidadoService.obtenerTodos().toPromise()
    ]).then(([usuarios, consolidados]) => {
      this.usuarios = usuarios || [];
      this.consolidados = consolidados || [];
      
      // Calcular estadísticas por usuario
      this.usuariosConStats = this.usuarios.map(user => {
        const creados = this.consolidados.filter(c => c.usuarioReporta === user.username).length;
        const asignados = this.consolidados.filter(c => c.usuarioAsignado === user.username).length;
        
        return {
          usuario: user,
          creados,
          asignados
        };
      });
      
      this.isLoading = false;
    }).catch(error => {
      console.error('Error al cargar datos', error);
      this.isLoading = false;
    });
  }

  tieneRolAdmin(user: User): boolean {
    return user.roles.some(r => r.name === 'ROLE_ADMIN');
  }

  crearUsuario(): void {
    this.router.navigate(['/usuarios/crear']);
  }

  verConsolidados(username: string): void {
    this.router.navigate(['/consolidados'], { 
      queryParams: { usuario: username } 
    });
  }

  asignarRol(username: string): void {
    if (confirm(`¿Asignar rol ADMIN a ${username}?`)) {
      this.authService.assignRole(username, 'ROLE_ADMIN').subscribe({
        next: () => {
          alert('Rol asignado correctamente');
          this.cargarDatos();
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
          this.cargarDatos();
        },
        error: (error) => {
          alert('Error al eliminar usuario');
        }
      });
    }
  }
}