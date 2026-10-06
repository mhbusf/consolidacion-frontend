import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ConsolidadoResponse } from '../../../core/models/consolidado.model';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../core/models/auth.model';

interface UsuarioConStats {
  usuario: User;
  creados: number;
  asignados: number;
}

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h2>Gestión de Usuarios</h2>
        @if (esAdmin) {
        <div class="actions">
          <button class="btn-primary" (click)="crearUsuario()">+ Crear Usuario</button>
        </div>
        }
      </div>
    
      @if (isLoading) {
        <div class="loading">
          Cargando usuarios...
        </div>
      }
    
      @if (!isLoading) {
        <div class="search-bar">
          <input
            type="text"
            [(ngModel)]="busqueda"
            placeholder="Buscar por nombre, apellido, usuario o correo..."
            aria-label="Buscar por nombre, apellido, usuario o correo"
            class="search-input"
            />
          <span class="search-count">{{ usuariosFiltrados.length }} resultado{{ usuariosFiltrados.length !== 1 ? 's' : '' }}</span>
        </div>
      }
    
      @if (!isLoading) {
        <div class="usuarios-table">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Estado</th>
                <th>Consolidados</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (user of usuariosFiltrados; track user) {
                <tr>
                  <td><strong>{{ user.usuario.username }}</strong></td>
                  <td>{{ nombreCompleto(user.usuario) || 'Sin nombre registrado' }}</td>
                  <td>{{ user.usuario.email }}</td>
                  <td>
                    @for (role of user.usuario.roles; track role) {
                      <span class="badge">
                        {{ role.name.replace('ROLE_', '') }}
                      </span>
                    }
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
                    @if (esAdmin) {
                    <div class="action-buttons">
                      <button
                        class="btn-small btn-info"
                        (click)="verConsolidados(user.usuario.username)"
                        title="Ver consolidados">
                        📊 Consolidados
                      </button>
                      @if (esSuperAdmin || !tienePerfilProtegido(user.usuario)) {
                        <button
                          class="btn-small btn-warning"
                          (click)="cambiarPassword(user.usuario.username)"
                          title="Cambiar contraseña">
                          🔑 Cambiar Pass
                        </button>
                      }
                      @if (!esPerfilUsuario(user.usuario)) {
                        <button
                          class="btn-small btn-primary"
                          (click)="asignarPerfil(user.usuario.username, 'ROLE_USER', 'USUARIO')"
                          title="Hacer usuario">
                          Usuario
                        </button>
                      }
                      @if (!tieneRolAdmin(user.usuario)) {
                        <button
                          class="btn-small btn-primary"
                          (click)="asignarPerfil(user.usuario.username, 'ROLE_ADMIN', 'ADMIN')"
                          title="Hacer administrador">
                          ⭐ Admin
                        </button>
                      }
                      @if (!tieneRolMentor(user.usuario)) {
                        <button
                          class="btn-small btn-primary"
                          (click)="asignarPerfil(user.usuario.username, 'ROLE_MENTOR', 'MENTOR')"
                          title="Hacer mentor">
                          Mentor
                        </button>
                      }
                      @if (!tieneRolSuperAdmin(user.usuario)) {
                        <button
                          class="btn-small btn-primary"
                          (click)="asignarPerfil(user.usuario.username, 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN')"
                          title="Hacer superadministrador">
                          ⭐ Super Admin
                        </button>
                      }
                      @if (esSuperAdmin || !tienePerfilProtegido(user.usuario)) {
                        <button
                          class="btn-small btn-danger"
                          (click)="eliminarUsuario(user.usuario.username)"
                          title="Eliminar usuario">
                          🗑️ Eliminar
                        </button>
                      }
                    </div>
                    } @else {
                      <span class="restricted">Solo lectura</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
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
      background: var(--primary-light);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .search-input {
      flex: 1;
      max-width: 400px;
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary-light);
    }

    .search-count {
      font-size: 13px;
      color: var(--text-muted);
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }

    .usuarios-table {
      background: var(--bg-card);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: var(--bg-secondary);
    }

    th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 2px solid var(--border-color);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 15px;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
    }

    tbody tr:hover {
      background: var(--bg-hover);
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      background: rgba(59, 130, 246, 0.1);
      color: var(--info);
      border: 1px solid var(--info);
      border-radius: 4px;
      font-size: 12px;
      margin-right: 5px;
    }

    .status-active {
      color: var(--success);
      font-weight: 500;
    }

    .status-inactive {
      color: var(--danger);
      font-weight: 500;
    }

    .stats-mini {
      display: flex;
      gap: 10px;
    }

    .stat-item {
      font-size: 13px;
      color: var(--text-muted);
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .restricted {
      color: var(--text-muted);
      font-size: 12px;
    }

    .btn-small {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      white-space: nowrap;
      color: white;
    }

    .btn-primary {
      background: var(--primary-light);
    }

    .btn-info {
      background: var(--info);
    }

    .btn-warning {
      background: var(--warning);
      color: var(--bg-primary);
    }

    .btn-danger {
      background: var(--danger);
    }

    .btn-small:hover {
      opacity: 0.9;
    }
  `]
})
export class UsuariosListComponent implements OnInit {
  usuarios: User[] = [];
  usuariosConStats: UsuarioConStats[] = [];
  consolidados: ConsolidadoResponse[] = [];
  isLoading = true;
  busqueda = '';
  readonly esAdmin: boolean;
  readonly esSuperAdmin: boolean;

  get usuariosFiltrados(): UsuarioConStats[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.usuariosConStats;
    return this.usuariosConStats.filter(u =>
      u.usuario.username.toLowerCase().includes(q) ||
      (u.usuario.email || '').toLowerCase().includes(q) ||
      (u.usuario.nombre || '').toLowerCase().includes(q) ||
      (u.usuario.apellido || '').toLowerCase().includes(q) ||
      this.nombreCompleto(u.usuario).toLowerCase().includes(q)
    );
  }

  constructor(
    private authService: AuthService,
    private consolidadoService: ConsolidadoService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.esAdmin = this.authService.isAdmin();
    this.esSuperAdmin = this.authService.isSuperAdmin();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading = true;
    
    forkJoin({
      usuarios: this.authService.getAllUsers(),
      consolidados: this.consolidadoService.obtenerTodos()
    }).subscribe({
      next: ({ usuarios, consolidados }) => {
      this.usuarios = usuarios;
      this.consolidados = consolidados;
      
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
      },
      error: (error) => {
      console.error('Error al cargar datos', error);
      this.notificationService.error('Error al cargar usuarios');
      this.isLoading = false;
      }
    });
  }

  tieneRolAdmin(user: User): boolean {
    return user.roles.some(r => r.name === 'ROLE_ADMIN');
  }

  tieneRolSuperAdmin(user: User): boolean {
    return user.roles.some(r => r.name === 'ROLE_SUPER_ADMIN');
  }

  tieneRolMentor(user: User): boolean {
    return user.roles.some(r => r.name === 'ROLE_MENTOR');
  }

  esPerfilUsuario(user: User): boolean {
    return user.roles.length === 1 && user.roles[0].name === 'ROLE_USER';
  }

  tienePerfilProtegido(user: User): boolean {
    return this.tieneRolMentor(user) || this.tieneRolSuperAdmin(user);
  }

  nombreCompleto(user: User): string {
    return [user.nombre, user.apellido]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  crearUsuario(): void {
    if (!this.esAdmin) return;
    this.router.navigate(['/usuarios/crear']);
  }

  verConsolidados(username: string): void {
    this.router.navigate(['/consolidados'], { 
      queryParams: { usuario: username } 
    });
  }

  cambiarPassword(username: string): void {
    if (!this.esAdmin) return;
    const newPassword = prompt(`Ingrese la nueva contraseña para ${username}:`);
    
    if (newPassword && newPassword.trim()) {
      if (newPassword.length < 6) {
        this.notificationService.warning('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      const confirmar = confirm(`¿Está seguro de cambiar la contraseña de ${username}?`);
      
      if (confirmar) {
        this.authService.changeUserPassword(username, newPassword).subscribe({
          next: () => {
            this.notificationService.success('Contraseña actualizada correctamente');
          },
          error: (error) => {
            this.notificationService.error('Error al cambiar contraseña');
          }
        });
      }
    }
  }

  asignarPerfil(username: string, role: 'ROLE_USER' | 'ROLE_MENTOR' | 'ROLE_ADMIN' | 'ROLE_SUPER_ADMIN', label: string): void {
    if (!this.esAdmin) return;
    if (confirm(`¿Asignar perfil ${label} a ${username}?`)) {
      this.authService.assignRole(username, role).subscribe({
        next: () => {
          this.notificationService.success('Perfil asignado. El usuario debe volver a iniciar sesión.');
          this.cargarDatos();
        },
        error: (error) => {
          this.notificationService.error('Error al asignar perfil');
        }
      });
    }
  }

  eliminarUsuario(username: string): void {
    if (!this.esAdmin) return;
    if (confirm(`¿Está seguro de eliminar al usuario ${username}?\n\nEsta acción no se puede deshacer.`)) {
      this.authService.deleteUser(username).subscribe({
        next: () => {
          this.notificationService.success('Usuario eliminado correctamente');
          this.cargarDatos();
        },
        error: (error) => {
          this.notificationService.error('Error al eliminar usuario');
        }
      });
    }
  }
}
