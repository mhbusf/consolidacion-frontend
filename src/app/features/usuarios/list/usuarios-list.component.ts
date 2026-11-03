import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ConsolidadoResponse } from '../../../core/models/consolidado.model';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ROLE_OPTIONS, RoleName, User, normalizeRoleNames, toggleRoleName } from '../../../core/models/auth.model';
import { LoggerService } from '../../../core/services/logger.service';
import { HttpErrorMapperService } from '../../../core/services/http-error-mapper.service';

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
                    <div class="persisted-roles">
                      @for (role of user.usuario.roles; track role.id) {
                        <span class="badge">{{ role.name.replace('ROLE_', '') }}</span>
                      }
                    </div>
                    @if (esAdmin) {
                      <div class="role-editor" [attr.aria-label]="'Editar roles de ' + user.usuario.username">
                        @for (role of roleOptions; track role.name) {
                          <label>
                            <input
                              type="checkbox"
                              [checked]="draftHasRole(user.usuario, role.name)"
                              [disabled]="savingRoleIds.has(user.usuario.id)"
                              (change)="toggleUserRole(user.usuario, role.name, $event)"
                            >
                            {{ role.label }}
                          </label>
                        }
                        <button
                          type="button"
                          class="btn-small btn-primary save-roles"
                          [disabled]="!roleDraft(user.usuario).length || !rolesChanged(user.usuario) || savingRoleIds.has(user.usuario.id)"
                          (click)="guardarRoles(user.usuario)"
                        >{{ savingRoleIds.has(user.usuario.id) ? 'Guardando...' : 'Guardar roles' }}</button>
                      </div>
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
                      @if (user.usuario.enabled && (esSuperAdmin || !tienePerfilProtegido(user.usuario))) {
                        <button
                          class="btn-small btn-danger"
                          (click)="eliminarUsuario(user.usuario.username)"
                          title="Desactivar usuario">
                          🗑️ Desactivar
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
    @if (modalAccion) {
      <div class="modal-backdrop" (click)="cerrarModal()">
        <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="user-action-title" (click)="$event.stopPropagation()">
          <h3 id="user-action-title">{{ modalAccion === 'password' ? 'Cambiar contraseña' : 'Desactivar usuario' }}</h3>
          <p>Usuario: <strong>{{ modalUsuario }}</strong></p>
          @if (modalAccion === 'password') {
            <label>Nueva contraseña<input type="password" [(ngModel)]="nuevaPassword" autocomplete="new-password"></label>
            <label>Confirmar contraseña<input type="password" [(ngModel)]="confirmarPassword" autocomplete="new-password"></label>
            <small>Mínimo 8 caracteres. Las dos contraseñas deben coincidir.</small>
          } @else {
            <p>Esta persona no podrá iniciar sesión y su historial se conservará.</p>
          }
          @if (modalError) {<p class="modal-error" role="alert">{{ modalError }}</p>}
          <div class="modal-actions">
            <button type="button" class="modal-cancel" [disabled]="modalSaving" (click)="cerrarModal()">Cancelar</button>
            <button type="button" [class.btn-danger]="modalAccion === 'deactivate'" [disabled]="modalSaving" (click)="confirmarAccion()">{{ modalSaving ? 'Procesando...' : (modalAccion === 'password' ? 'Actualizar contraseña' : 'Desactivar usuario') }}</button>
          </div>
        </section>
      </div>
    }
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

    .persisted-roles {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 10px;
    }

    .role-editor {
      display: grid;
      gap: 6px;
      min-width: 180px;
      padding: 10px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-secondary);
    }

    .role-editor label {
      display: flex;
      align-items: center;
      gap: 7px;
      color: var(--text-secondary);
      font-size: 12px;
      cursor: pointer;
    }

    .save-roles {
      margin-top: 4px;
    }

    .btn-small:disabled {
      opacity: .5;
      cursor: not-allowed;
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
    .modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 18px; background: rgba(9,24,39,.68); }
    .modal-card { box-sizing: border-box; width: min(460px,100%); padding: 26px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--bg-card); box-shadow: 0 24px 70px rgba(0,0,0,.3); }
    .modal-card h3 { margin: 0 0 10px; }.modal-card label { display: grid; gap: 7px; margin-top: 15px; font-weight: 700; }.modal-card input { box-sizing: border-box; width: 100%; padding: 11px; border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); background: var(--bg-secondary); }.modal-card small { display: block; margin-top: 9px; color: var(--text-muted); }.modal-error { color: var(--danger); font-weight: 700; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }.modal-actions button { padding: 10px 14px; border: 0; border-radius: 8px; color: white; background: var(--primary-light); font-weight: 750; cursor: pointer; }.modal-actions .modal-cancel { color: var(--text-primary); background: var(--bg-secondary); border: 1px solid var(--border-color); }.modal-actions button:disabled { opacity: .55; cursor: wait; }
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
  readonly roleOptions = ROLE_OPTIONS;
  readonly savingRoleIds = new Set<number>();
  modalAccion: 'password' | 'deactivate' | null = null;
  modalUsuario = '';
  nuevaPassword = '';
  confirmarPassword = '';
  modalError = '';
  modalSaving = false;
  private readonly roleDrafts = new Map<number, RoleName[]>();

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
    private router: Router,
    private logger: LoggerService,
    private errorMapper: HttpErrorMapperService
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
      this.roleDrafts.clear();
      this.consolidados = consolidados;
      
      this.usuariosConStats = this.usuarios.map(user => {
        this.roleDrafts.set(user.id, this.userRoleNames(user));
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
      this.logger.httpError('users.list.load', error);
      this.notificationService.error('Error al cargar usuarios');
      this.isLoading = false;
      }
    });
  }

  tieneRolAdmin(user: User): boolean {
    return user.roles.some(r => r.name === 'ROLE_ADMIN');
  }

  roleDraft(user: User): RoleName[] {
    return this.roleDrafts.get(user.id) ?? this.userRoleNames(user);
  }

  draftHasRole(user: User, roleName: RoleName): boolean {
    return this.roleDraft(user).includes(roleName);
  }

  toggleUserRole(user: User, roleName: RoleName, event: Event): void {
    this.roleDrafts.set(user.id, toggleRoleName(
      this.roleDraft(user),
      roleName,
      (event.target as HTMLInputElement).checked,
    ));
  }

  rolesChanged(user: User): boolean {
    return this.roleDraft(user).join('|') !== this.userRoleNames(user).join('|');
  }

  guardarRoles(user: User): void {
    const roleNames = this.roleDraft(user);
    if (!this.esAdmin || !roleNames.length || this.savingRoleIds.has(user.id)) return;

    this.savingRoleIds.add(user.id);
    this.authService.updateRoles(user.username, roleNames).subscribe({
      next: updatedUser => {
        const updated = { ...user, ...updatedUser };
        this.usuarios = this.usuarios.map(item => item.id === user.id ? updated : item);
        this.usuariosConStats = this.usuariosConStats.map(item =>
          item.usuario.id === user.id ? { ...item, usuario: updated } : item,
        );
        this.roleDrafts.set(user.id, this.userRoleNames(updated));
        this.savingRoleIds.delete(user.id);
        this.notificationService.success('Roles actualizados. El usuario debe volver a iniciar sesión.');
      },
      error: () => {
        this.savingRoleIds.delete(user.id);
        this.notificationService.error('Error al actualizar roles');
      },
    });
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
    this.abrirModal('password', username);
  }

  eliminarUsuario(username: string): void {
    if (!this.esAdmin) return;
    this.abrirModal('deactivate', username);
  }

  confirmarAccion(): void {
    if (!this.modalAccion || !this.modalUsuario || this.modalSaving) return;
    this.modalError = '';
    if (this.modalAccion === 'password') {
      if (this.nuevaPassword.length < 8) {
        this.modalError = 'La contraseña debe tener al menos 8 caracteres.';
        return;
      }
      if (this.nuevaPassword !== this.confirmarPassword) {
        this.modalError = 'Las contraseñas no coinciden.';
        return;
      }
      this.modalSaving = true;
      this.authService.changeUserPassword(this.modalUsuario, this.nuevaPassword).subscribe({
        next: () => {
          this.notificationService.success('Contraseña actualizada.');
          this.modalSaving = false;
          this.cerrarModal();
        },
        error: (error) => {
          this.logger.httpError('users.password.update', error);
          this.modalError = this.errorMapper.message(error, { fallback: 'No fue posible cambiar la contraseña.' });
          this.modalSaving = false;
        },
      });
      return;
    }

    this.modalSaving = true;
    const username = this.modalUsuario;
      this.authService.deleteUser(username).subscribe({
        next: () => {
          this.notificationService.success('Usuario desactivado.');
          this.modalSaving = false;
          this.cerrarModal();
          this.cargarDatos();
        },
        error: (error: unknown) => {
          this.logger.httpError('users.deactivate', error);
          this.modalError = this.errorMapper.message(error, { fallback: 'No fue posible desactivar el usuario.' });
          this.modalSaving = false;
        }
      });
  }

  cerrarModal(): void {
    if (this.modalSaving) return;
    this.modalAccion = null;
    this.modalUsuario = '';
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.modalError = '';
  }

  private abrirModal(accion: 'password' | 'deactivate', username: string): void {
    this.modalAccion = accion;
    this.modalUsuario = username;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.modalError = '';
  }

  private userRoleNames(user: User): RoleName[] {
    const allowed = new Set<RoleName>(ROLE_OPTIONS.map(option => option.name));
    return normalizeRoleNames(user.roles
      .map(role => role.name as RoleName)
      .filter(role => allowed.has(role)));
  }
}
