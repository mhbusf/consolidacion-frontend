import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConsolidadoResponse } from '../../../core/models/consolidado.model';

@Component({
  selector: 'app-asignar-consolidado',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="container">
      <h2>Asignar Consolidado</h2>

      @if (isLoadingDatos) {
        <div class="status" aria-live="polite">Cargando información de asignación...</div>
      }

      @if (!isLoadingDatos && errorCarga) {
        <div class="status error-state" role="alert">
          <p>{{ errorCarga }}</p>
          <button type="button" class="btn-secondary" (click)="cargarDatos()">Reintentar</button>
        </div>
      }

      @if (!isLoadingDatos && !errorCarga && consolidado) {
      <div class="card">
        <div class="identity">
          <p><strong>Persona:</strong> {{ consolidado.nombre }}</p>
          <p><strong>Teléfono:</strong> {{ consolidado.telefono }}</p>
          <p><strong>Asignación actual:</strong> {{ consolidado.usuarioAsignado || 'Sin asignar' }}</p>
        </div>
    
        <div class="form-group">
          <label for="buscar-usuario">Buscar Usuario:</label>
          <input
            id="buscar-usuario"
            type="search"
            [(ngModel)]="busquedaUsuario"
            (ngModelChange)="usuarioSeleccionado = ''"
            class="form-control"
            placeholder="Nombre, usuario o correo..."
            autocomplete="off"
            aria-describedby="resultado-busqueda"
          />
          <p id="resultado-busqueda" class="search-status" aria-live="polite">
            @if (busquedaUsuario.trim()) {
              {{ usuariosFiltrados.length }} de {{ usuarios.length }} usuario{{ usuariosFiltrados.length === 1 ? '' : 's' }}
            } @else {
              Escribe para filtrar el listado de usuarios.
            }
          </p>
        </div>

        <div class="form-group">
          <label for="usuario">Seleccionar Usuario:</label>
          <select
            id="usuario"
            [(ngModel)]="usuarioSeleccionado"
            class="form-control"
            [disabled]="usuariosFiltrados.length === 0">
            @if (usuariosFiltrados.length > 0) {
              <option value="">-- Seleccione un usuario --</option>
              @for (user of usuariosFiltrados; track user.username) {
                <option [value]="user.username">
                  @if (user.nombre || user.apellido) {
                    {{ user.nombre }} {{ user.apellido }} -
                  }
                  {{ user.username }} ({{ user.email }})
                </option>
              }
            } @else {
              <option value="">-- No se encontraron usuarios --</option>
            }
          </select>
        </div>
    
        <div class="actions">
          <button class="btn-secondary" (click)="cancelar()">Cancelar</button>
          <button
            class="btn-primary"
            (click)="asignar()"
            [disabled]="!usuarioSeleccionado || isLoading">
            {{ isLoading ? 'Asignando...' : 'Asignar' }}
          </button>
        </div>
      </div>
      }
    </div>
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
    }

    .card {
      background: var(--bg-card);
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
    }

    .status { text-align: center; padding: 28px; color: var(--text-secondary); }
    .error-state { border: 1px solid var(--danger); border-radius: 8px; }
    .error-state p { color: var(--danger); }
    .identity { padding: 14px; border-radius: 8px; background: var(--bg-secondary); }
    .identity p { margin: 6px 0; color: var(--text-primary); }

    .form-group {
      margin: 20px 0;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-light);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .search-status {
      min-height: 18px;
      margin: 6px 0 0;
      color: var(--text-muted);
      font-size: 12px;
    }

    .actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 30px;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary {
      background: var(--primary-light);
      color: white;
    }

    .btn-secondary {
      background: var(--secondary);
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }


    @media (max-width: 600px) {
      .container { margin: 20px auto; padding: 12px; }
      .card { padding: 20px 16px; }
      .actions { flex-direction: column-reverse; }
      .actions button { width: 100%; min-height: 44px; }
    }
  `]
})
export class AsignarConsolidadoComponent implements OnInit {
  consolidadoId!: number;
  consolidado: ConsolidadoResponse | null = null;
  usuarios: User[] = [];
  busquedaUsuario = '';
  usuarioSeleccionado = '';
  isLoading = false;
  isLoadingDatos = true;
  errorCarga = '';
  private returnUrl = '';

  get usuariosFiltrados(): User[] {
    const termino = this.normalizarBusqueda(this.busquedaUsuario);
    if (!termino) return this.usuarios;

    return this.usuarios.filter(user => {
      const datosUsuario = [user.nombre, user.apellido, user.username, user.email]
        .filter((value): value is string => !!value)
        .join(' ');

      return this.normalizarBusqueda(datosUsuario).includes(termino);
    });
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consolidadoService: ConsolidadoService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.consolidadoId = Number(this.route.snapshot.paramMap.get('id'));
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '';
    this.returnUrl = returnUrl.startsWith('/consolidados')
      ? returnUrl
      : `/consolidados/${this.consolidadoId}`;
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoadingDatos = true;
    this.errorCarga = '';
    let consolidadoCargado = false;
    let usuariosCargados = false;
    const completar = () => {
      if (consolidadoCargado && usuariosCargados) this.isLoadingDatos = false;
    };

    this.consolidadoService.obtenerPorId(this.consolidadoId).subscribe({
      next: consolidado => {
        this.consolidado = consolidado;
        consolidadoCargado = true;
        completar();
      },
      error: (error) => {
        console.error('Error al cargar consolidado', error);
        this.errorCarga = error?.error?.message || 'No fue posible cargar el consolidado.';
        this.isLoadingDatos = false;
      },
    });

    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.usuarios = users.filter(u =>
          u.roles.some(r => ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(r.name))
        );
        usuariosCargados = true;
        completar();
      },
      error: (error) => {
        console.error('Error al cargar usuarios', error);
        this.errorCarga = error?.error?.message || 'No fue posible cargar los usuarios disponibles.';
        this.isLoadingDatos = false;
      }
    });
  }

  asignar(): void {
    if (!this.usuarioSeleccionado) return;

    this.isLoading = true;
    this.consolidadoService.asignarUsuario(this.consolidadoId, this.usuarioSeleccionado).subscribe({
  next: () => {
    this.notificationService.success('Consolidado asignado correctamente');
    void this.router.navigateByUrl(this.returnUrl);
  },
  error: (error) => {
    this.notificationService.error('Error al asignar');
    this.isLoading = false;
  }
});
  }

  cancelar(): void {
    void this.router.navigateByUrl(this.returnUrl);
  }

  private normalizarBusqueda(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
