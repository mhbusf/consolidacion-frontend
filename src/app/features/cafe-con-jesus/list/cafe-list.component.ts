import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CafeConJesusService,
  CafeConJesusResponse,
  ETAPAS_CAFE,
  MOTIVOS_CIERRE_CAFE,
  etapaLabel,
} from '../../../core/services/cafe-con-jesus.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../core/models/auth.model';
import { Reunion } from '../../../core/models/consolidado.model';
import { ReunionService } from '../../../core/services/reunion.service';

@Component({
  selector: 'app-cafe-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h2>Cafe con Jesus</h2>
        <button class="btn-primary" (click)="nuevoRegistro()">
          + Nuevo Ingreso
        </button>
      </div>
    
      @if (isLoading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando registros...</p>
        </div>
      }
    
      @if (!isLoading && registros.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">☕</div>
          <h3>Sin registros</h3>
          <p>Aun no hay registros de Cafe con Jesus.</p>
          <button class="btn-primary" (click)="nuevoRegistro()">
            + Crear primer registro
          </button>
        </div>
      }
     
      @if (!isLoading && registros.length > 0) {
        <div class="search-card">
          <label for="busquedaInvitados">Buscar invitado</label>
          <input
            id="busquedaInvitados"
            type="search"
            [(ngModel)]="busqueda"
            class="form-control search-input"
            placeholder="Buscar por nombre o apellido..."
          />
          <span class="results-count">{{ registrosFiltrados.length }} de {{ registros.length }}</span>
        </div>

        @if (registrosFiltrados.length === 0) {
          <div class="empty-state compact-empty">
            <h3>Sin resultados</h3>
            <p>No hay invitados que coincidan con "{{ busqueda }}".</p>
          </div>
        }

        @if (registrosFiltrados.length > 0) {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Telefono</th>
                <th>Culto/Reunión</th>
                <th>Fecha Ingreso</th>
                <th>Etapa</th>
                <th>Asignado a</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (r of registrosFiltrados; track r) {
                <tr>
                  <td class="fw-bold nombre-link" (click)="verDetalle(r)">{{ r.nombre }}</td>
                  <td>{{ r.telefono }}</td>
                  <td>{{ r.reunionNombre || '—' }}</td>
                  <td>{{ r.fechaIngreso | date : 'dd/MM/yyyy' }}</td>
                  <td>
                    @if (r.etapa) {
                      <span class="badge-etapa" [ngClass]="getEtapaClass(r.etapa)">{{ getEtapaLabel(r.etapa) }}</span>
                    }
                    @if (!r.etapa) {
                      <span class="text-muted-sm">—</span>
                    }
                  </td>
                  <td>
                    @if (r.usuarioAsignado) {
                      <span class="user-badge badge-asignado">{{ r.usuarioAsignado }}</span>
                    }
                    @if (!r.usuarioAsignado) {
                      <span class="badge badge-pending">Sin asignar</span>
                    }
                  </td>
                  <td class="actions-cell">
                    <button class="btn-secondary" type="button" (click)="verDetalle(r)">Ver ficha</button>
                    <button class="btn-edit" (click)="editarRegistro(r)">Editar</button>
                    @if (!r.convertidoAConsolidado) {
                      <button class="btn-convertir" (click)="convertirAConsolidado(r)">
                        Acepto al Senor
                      </button>
                      @if (isAdmin) {
                        <button class="btn-warning" type="button" (click)="abrirCierre(r)">Cerrar</button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <!-- Modal detalle -->
          @if (registroDetalle) {
            <div class="modal-overlay" (click)="cerrarDetalle()">
              <div class="detalle-card" (click)="$event.stopPropagation()">
                <div class="detalle-header">
                  <div class="detalle-avatar">{{ registroDetalle.nombre[0] }}{{ registroDetalle.apellido[0] }}</div>
                  <div>
                    <h3 class="detalle-nombre">{{ registroDetalle.nombre }} {{ registroDetalle.apellido }}</h3>
                    @if (registroDetalle.etapa) {
                      <span class="badge-etapa" [ngClass]="getEtapaClass(registroDetalle.etapa)">
                        {{ getEtapaLabel(registroDetalle.etapa) }}
                      </span>
                    }
                    @if (!registroDetalle.etapa) {
                      <span class="text-muted-sm">Sin etapa asignada</span>
                    }
                  </div>
                  <button class="detalle-close" (click)="cerrarDetalle()">✕</button>
                </div>
                <div class="detalle-grid">
                  <div class="detalle-item">
                    <span class="detalle-label">Teléfono</span>
                    <span class="detalle-value">{{ registroDetalle.telefono || '-' }}</span>
                  </div>
                  <div class="detalle-item">
                    <span class="detalle-label">Edad</span>
                    <span class="detalle-value">{{ registroDetalle.edad || '-' }}</span>
                  </div>
                  <div class="detalle-item">
                    <span class="detalle-label">Invitado por</span>
                    <span class="detalle-value">{{ registroDetalle.invitadoPor || '-' }}</span>
                  </div>
                  <div class="detalle-item">
                    <span class="detalle-label">Culto/Reunión</span>
                    <span class="detalle-value">{{ registroDetalle.reunionNombre || '-' }}</span>
                  </div>
                  <div class="detalle-item">
                    <span class="detalle-label">Tel. Invitado por</span>
                    <span class="detalle-value">{{ registroDetalle.telefonoInvitadoPor || '-' }}</span>
                  </div>
                  <div class="detalle-item">
                    <span class="detalle-label">Asistió al Café</span>
                    <span class="badge" [class.badge-success]="registroDetalle.asistio" [class.badge-pending]="!registroDetalle.asistio">
                      {{ registroDetalle.asistio ? 'Sí' : 'No' }}
                    </span>
                  </div>
                  <div class="detalle-item">
                    <span class="detalle-label">Fecha asistencia</span>
                    <span class="detalle-value">{{ registroDetalle.fechaAsistencia ? (registroDetalle.fechaAsistencia | date: 'dd/MM/yyyy') : '-' }}</span>
                  </div>
                  <div class="detalle-item">
                    <span class="detalle-label">Registrado por</span>
                    <span class="detalle-value">{{ registroDetalle.registradoPor || '-' }}</span>
                  </div>
                  <div class="detalle-item">
                    <span class="detalle-label">Asignado a</span>
                    @if (registroDetalle.usuarioAsignado) {
                      <span class="user-badge badge-asignado">{{ registroDetalle.usuarioAsignado }}</span>
                    }
                    @if (!registroDetalle.usuarioAsignado) {
                      <span class="badge badge-pending">Sin asignar</span>
                    }
                  </div>
                </div>
                <!-- Historial de comentarios -->
                <div class="detalle-comentarios">
                  <div class="detalle-comentarios-titulo">Comentarios</div>
                  @if (registroDetalle.comentarios?.length) {
                    <div class="comentarios-lista">
                      @for (c of registroDetalle.comentarios; track c) {
                        <div class="comentario-item">
                          <div class="comentario-meta">
                            <span class="comentario-usuario">{{ c.usuario }}</span>
                            <span class="comentario-fecha">{{ c.fechaCreacion | date: 'dd/MM/yyyy HH:mm' }}</span>
                          </div>
                          <p class="comentario-texto">{{ c.contenido }}</p>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="sin-comentarios">Sin comentarios aún.</p>
                  }
                  <!-- Agregar comentario -->
                  <div class="nuevo-comentario">
                    <textarea
                      [(ngModel)]="nuevoComentario"
                      class="form-control"
                      rows="2"
                      placeholder="Escribir comentario...">
                    </textarea>
                    <button class="btn-agregar-comentario" (click)="agregarComentario()" [disabled]="!nuevoComentario.trim() || isSavingComentario">
                      {{ isSavingComentario ? 'Guardando...' : 'Agregar comentario' }}
                    </button>
                  </div>
                </div>
                <div class="detalle-actions">
                  <button class="btn-secondary" (click)="cerrarDetalle()">Cerrar</button>
                  <button class="btn-edit" (click)="editarDesdeDetalle()">Editar</button>
                </div>
              </div>
            </div>
          }
          <!-- Modal editar -->
          @if (registroEditando) {
            <div class="modal-overlay" (click)="cancelarEdicion()">
              <div class="modal-content" (click)="$event.stopPropagation()">
                <h3>Editar Registro</h3>
                <div class="form-group">
                  <label>Consolidador asignado</label>
                  <select [(ngModel)]="editUsuarioAsignado" class="form-control">
                    <option value="">Sin asignar</option>
                    @for (u of usuarios; track u) {
                      <option [value]="u.username">{{ u.username }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Culto/Reunión donde llegó</label>
                  <select [(ngModel)]="editReunionId" class="form-control">
                    <option [ngValue]="null">Seleccione un culto/reunión</option>
                    @for (reunion of reuniones; track reunion.id) {
                      <option [ngValue]="reunion.id">{{ reunion.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Asistio al Cafe con Jesus</label>
                  <select [(ngModel)]="editAsistio" class="form-control" (ngModelChange)="onAsistioChange()">
                    <option [ngValue]="false">No</option>
                    <option [ngValue]="true">Si</option>
                  </select>
                </div>
                @if (editAsistio) {
                  <div class="form-group">
                    <label>Fecha de Asistencia</label>
                    <input type="date" [(ngModel)]="editFechaAsistencia" class="form-control" />
                  </div>
                }
                <div class="form-group">
                  <label>Etapa de seguimiento</label>
                  <select [(ngModel)]="editEtapa" class="form-control">
                    <option value="">— Sin etapa —</option>
                    @for (e of etapas; track e) {
                      <option [value]="e.value">{{ e.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Comentario</label>
                  <textarea [(ngModel)]="editComentario" class="form-control" rows="3" placeholder="Agregar comentario..."></textarea>
                </div>
                <div class="modal-actions">
                  <button class="btn-secondary" (click)="cancelarEdicion()">Cancelar</button>
                  <button class="btn-primary" (click)="guardarEdicion()" [disabled]="isSaving">
                    {{ isSaving ? 'Guardando...' : 'Guardar' }}
                  </button>
                </div>
              </div>
            </div>
          }
          <!-- Modal cerrar -->
          @if (registroCerrando) {
            <div class="modal-overlay" (click)="cerrarCierre()">
              <div class="modal-content" (click)="$event.stopPropagation()">
                <h3>Cerrar seguimiento</h3>
                <p class="modal-sub">{{ registroCerrando.nombre }} {{ registroCerrando.apellido }}</p>
                <div class="form-group">
                  <label>Motivo de cierre</label>
                  <select [(ngModel)]="cierreMotivo" class="form-control">
                    <option value="">Seleccione un motivo</option>
                    @for (motivo of motivosCierre; track motivo.value) {
                      <option [value]="motivo.value">{{ motivo.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Comentario de cierre</label>
                  <textarea [(ngModel)]="cierreComentario" class="form-control" rows="4" maxlength="1000" placeholder="Ej.: Se realizaron tres llamados sin respuesta."></textarea>
                </div>
                <div class="modal-actions">
                  <button class="btn-secondary" type="button" (click)="cerrarCierre()">Cancelar</button>
                  <button class="btn-warning" type="button" (click)="confirmarCierre()" [disabled]="!cierreMotivo || !cierreComentario.trim() || isSavingCierre">
                    {{ isSavingCierre ? 'Guardando...' : 'Confirmar cierre' }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
        }
      }
    </div>
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .container {
        max-width: 1600px;
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
        overflow-x: auto;
        border: 1px solid var(--border-color);
      }

      .search-card {
        display: grid;
        grid-template-columns: minmax(220px, 420px) auto;
        align-items: end;
        gap: 10px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .search-card label {
        grid-column: 1 / -1;
        color: var(--text-muted);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }

      .search-input {
        max-width: 420px;
      }

      .results-count {
        color: var(--text-secondary);
        font-size: 13px;
        white-space: nowrap;
      }

      .compact-empty {
        padding: 28px 20px;
      }

      .data-table {
        width: 100%;
       min-width: 900px;
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

      .badge {
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
      }

      .badge-success {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
      }

      .badge-pending {
        background: rgba(234, 179, 8, 0.15);
        color: #eab308;
      }

      .badge-asignado {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
      }

      .comentario-cell {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .badge-etapa {
        padding: 3px 10px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }

      .etapa-1 { background: rgba(59,130,246,0.15); color: #3b82f6; }
      .etapa-2 { background: rgba(99,102,241,0.15); color: #6366f1; }
      .etapa-3 { background: rgba(139,92,246,0.15); color: #8b5cf6; }
      .etapa-4 { background: rgba(34,197,94,0.15);  color: #22c55e; }
      .etapa-5 { background: rgba(107,114,128,0.15);color: #6b7280; }

      .text-muted-sm { color: var(--text-muted); font-size: 13px; }

      .btn-edit {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-edit:hover {
        opacity: 0.8;
      }

      .btn-convertir {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-convertir:hover {
        opacity: 0.8;
      }

      .actions-cell {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .nombre-link {
        cursor: pointer;
        color: var(--primary-light);
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      .nombre-link:hover {
        opacity: 0.8;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      /* Tarjeta detalle */
      .detalle-card {
        background: var(--bg-card);
        border-radius: 16px;
        border: 1px solid var(--border-color);
        width: 90%;
        max-width: 560px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        overflow: hidden;
      }

      .detalle-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px 24px 20px;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
        position: relative;
      }

      .detalle-avatar {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--primary-light);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 700;
        flex-shrink: 0;
        text-transform: uppercase;
      }

      .detalle-nombre {
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 6px;
      }

      .detalle-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: background 0.2s;
      }

      .detalle-close:hover {
        background: var(--bg-hover);
      }

      .detalle-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        padding: 8px 0;
      }

      .detalle-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px 24px;
        border-bottom: 1px solid var(--border-color);
      }

      .detalle-item:nth-last-child(-n+2) {
        border-bottom: none;
      }

      .detalle-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
      }

      .detalle-value {
        font-size: 14px;
        color: var(--text-primary);
        font-weight: 500;
      }

      .detalle-comentarios {
        border-top: 1px solid var(--border-color);
        padding: 16px 24px;
      }

      .detalle-comentarios-titulo {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        margin-bottom: 12px;
      }

      .comentarios-lista {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 12px;
        padding-right: 4px;
      }

      .comentario-item {
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 10px 14px;
      }

      .comentario-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }

      .comentario-usuario {
        font-size: 12px;
        font-weight: 700;
        color: var(--primary-light);
      }

      .comentario-fecha {
        font-size: 11px;
        color: var(--text-muted);
      }

      .comentario-texto {
        font-size: 13px;
        color: var(--text-primary);
        line-height: 1.5;
        margin: 0;
        white-space: pre-wrap;
      }

      .sin-comentarios {
        font-size: 13px;
        color: var(--text-muted);
        text-align: center;
        padding: 8px 0 12px;
      }

      .nuevo-comentario {
        display: flex;
        gap: 8px;
        align-items: flex-end;
        margin-top: 4px;
      }

      .nuevo-comentario .form-control {
        flex: 1;
        resize: none;
        font-size: 13px;
      }

      .btn-agregar-comentario {
        background: var(--primary-light);
        color: white;
        border: none;
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: opacity 0.2s;
      }

      .btn-agregar-comentario:hover { opacity: 0.9; }
      .btn-agregar-comentario:disabled { opacity: 0.5; cursor: not-allowed; }

      .detalle-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        padding: 16px 24px;
        border-top: 1px solid var(--border-color);
        background: var(--bg-secondary);
      }

      .modal-content {
        background: var(--bg-card);
        padding: 30px;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        border: 1px solid var(--border-color);
      }

      .modal-content h3 {
        margin-bottom: 20px;
        color: var(--text-primary);
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        margin-bottom: 6px;
        color: var(--text-secondary);
        font-weight: 500;
        font-size: 14px;
      }

      .form-control {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 14px;
        font-family: inherit;
        box-sizing: border-box;
        background: var(--bg-secondary);
        color: var(--text-primary);
      }

      .form-control:focus {
        outline: none;
        border-color: var(--primary-light);
      }

      textarea.form-control {
        resize: vertical;
      }

      .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 24px;
      }

      .btn-primary, .btn-secondary {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-secondary {
        background: var(--secondary);
        color: white;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      @media (max-width: 640px) {
        .search-card {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CafeListComponent implements OnInit {
  registros: CafeConJesusResponse[] = [];
  usuarios: User[] = [];
  reuniones: Reunion[] = [];
  isLoading = true;
  isAdmin = false;
  busqueda = '';

  etapas = ETAPAS_CAFE;
  motivosCierre = MOTIVOS_CIERRE_CAFE;

  // Detalle
  registroDetalle: CafeConJesusResponse | null = null;
  nuevoComentario = '';
  isSavingComentario = false;

  // Edicion
  registroEditando: CafeConJesusResponse | null = null;
  editAsistio = false;
  editFechaAsistencia = '';
  editComentario = '';
  editUsuarioAsignado = '';
  editEtapa = '';
  editReunionId: number | null = null;
  isSaving = false;
  registroCerrando: CafeConJesusResponse | null = null;
  cierreMotivo = '';
  cierreComentario = '';
  isSavingCierre = false;

  constructor(
    private cafeService: CafeConJesusService,
    private authService: AuthService,
    private reunionService: ReunionService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.cargarRegistros();
    this.cargarReuniones();
    if (this.isAdmin) {
      this.authService.getAllUsers().subscribe({
        next: (users) => { this.usuarios = users; },
        error: (error) => { console.error('Error al cargar usuarios', error); }
      });
    }
  }

  cargarRegistros(): void {
    this.isLoading = true;
    const obs$ = this.isAdmin
      ? this.cafeService.listarTodos()
      : this.cafeService.listarMios();

    obs$.subscribe({
      next: (data) => {
        this.registros = data.filter(r => !r.convertidoAConsolidado && !r.archivado);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar registros:', error);
        this.isLoading = false;
      },
    });
  }

  cargarReuniones(): void {
    this.reunionService.listar().subscribe({
      next: (data) => { this.reuniones = data; },
      error: () => { this.notificationService.error('Error al cargar cultos/reuniones'); }
    });
  }

  nuevoRegistro(): void {
    this.router.navigate(['/cafe-con-jesus/nuevo']);
  }

  get registrosFiltrados(): CafeConJesusResponse[] {
    const term = this.normalizarTexto(this.busqueda);
    if (!term) return this.registros;

    return this.registros.filter(r => {
      const nombre = this.normalizarTexto(r.nombre);
      const apellido = this.normalizarTexto(r.apellido);
      const nombreCompleto = this.normalizarTexto(`${r.nombre || ''} ${r.apellido || ''}`);
      return nombre.includes(term) || apellido.includes(term) || nombreCompleto.includes(term);
    });
  }

  private normalizarTexto(value: string | null | undefined): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  verDetalle(r: CafeConJesusResponse): void {
    this.registroDetalle = r;
  }

  cerrarDetalle(): void {
    this.registroDetalle = null;
    this.nuevoComentario = '';
  }

  abrirCierre(r: CafeConJesusResponse): void {
    this.registroCerrando = r;
    this.cierreMotivo = '';
    this.cierreComentario = '';
  }

  cerrarCierre(): void {
    if (this.isSavingCierre) return;
    this.registroCerrando = null;
  }

  confirmarCierre(): void {
    if (!this.registroCerrando || !this.cierreMotivo || !this.cierreComentario.trim()) return;
    this.isSavingCierre = true;
    this.cafeService.archivar(this.registroCerrando.id, this.cierreMotivo, this.cierreComentario.trim()).subscribe({
      next: () => {
        this.notificationService.success('Seguimiento cerrado correctamente');
        this.isSavingCierre = false;
        this.cerrarCierre();
        this.cargarRegistros();
      },
      error: (error) => {
        this.notificationService.error(error?.error?.message || 'Error al cerrar el seguimiento');
        this.isSavingCierre = false;
      },
    });
  }

  agregarComentario(): void {
    if (!this.registroDetalle || !this.nuevoComentario.trim()) return;
    this.isSavingComentario = true;
    this.cafeService.agregarComentario(this.registroDetalle.id, this.nuevoComentario.trim()).subscribe({
      next: (actualizado) => {
        this.registroDetalle = actualizado;
        this.nuevoComentario = '';
        this.isSavingComentario = false;
        this.cargarRegistros();
      },
      error: () => {
        this.notificationService.error('Error al agregar comentario');
        this.isSavingComentario = false;
      },
    });
  }

  editarDesdeDetalle(): void {
    const r = this.registroDetalle!;
    this.registroDetalle = null;
    this.editarRegistro(r);
  }

  editarRegistro(r: CafeConJesusResponse): void {
    this.registroEditando = r;
    this.editAsistio = r.asistio || false;
    this.editFechaAsistencia = r.fechaAsistencia || '';
    this.editComentario = r.comentario || '';
    this.editUsuarioAsignado = r.usuarioAsignado || '';
    this.editEtapa = r.etapa || '';
    this.editReunionId = r.reunionId || null;
  }

  getEtapaLabel(value: string): string {
    return etapaLabel(value);
  }

  getEtapaClass(value: string): string {
    const idx = ETAPAS_CAFE.findIndex(e => e.value === value);
    return idx >= 0 ? `etapa-${idx + 1}` : '';
  }

  onAsistioChange(): void {
    if (!this.editAsistio) {
      this.editFechaAsistencia = '';
    }
  }

  cancelarEdicion(): void {
    this.registroEditando = null;
  }

  guardarEdicion(): void {
    if (!this.registroEditando) return;

    this.isSaving = true;
    const id = this.registroEditando.id;

    const request = {
      nombre: this.registroEditando.nombre,
      apellido: this.registroEditando.apellido,
      telefono: this.registroEditando.telefono,
      edad: this.registroEditando.edad,
      invitadoPor: this.registroEditando.invitadoPor,
      telefonoInvitadoPor: this.registroEditando.telefonoInvitadoPor,
      reunionId: this.editReunionId || undefined,
      comentario: this.editComentario,
      asistio: this.editAsistio,
      fechaAsistencia: this.editAsistio ? this.editFechaAsistencia : undefined,
      etapa: this.editEtapa || undefined,
    };

    this.cafeService.actualizar(id, request).subscribe({
      next: () => {
        // Si cambió el usuario asignado, llamar al endpoint de asignación
        if (this.editUsuarioAsignado && this.editUsuarioAsignado !== this.registroEditando?.usuarioAsignado) {
          this.cafeService.asignarUsuario(id, this.editUsuarioAsignado).subscribe({
            next: () => {
              this.notificationService.success('Registro actualizado y asignado correctamente');
              this.registroEditando = null;
              this.isSaving = false;
              this.cargarRegistros();
            },
            error: (error) => {
              console.error('Error al asignar:', error);
              this.notificationService.error('Registro actualizado pero error al asignar');
              this.isSaving = false;
              this.cargarRegistros();
            },
          });
        } else {
          this.notificationService.success('Registro actualizado correctamente');
          this.registroEditando = null;
          this.isSaving = false;
          this.cargarRegistros();
        }
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
        this.notificationService.error('Error al actualizar el registro');
        this.isSaving = false;
      },
    });
  }

  convertirAConsolidado(r: CafeConJesusResponse): void {
    if (!r.reunionId) {
      this.notificationService.warning('Debe editar el registro y seleccionar el culto/reunión antes de pasarlo a consolidación');
      return;
    }

    if (!confirm(`¿Confirmas que ${r.nombre} ${r.apellido} acepto al Senor? Se creara un registro en Consolidacion.`)) {
      return;
    }

    this.cafeService.convertirAConsolidado(r.id).subscribe({
      next: () => {
        this.notificationService.success('Registro convertido a consolidacion exitosamente');
        this.cargarRegistros();
      },
      error: (error) => {
        console.error('Error al convertir:', error);
        this.notificationService.error(error.error?.message || 'Error al convertir a consolidado');
      },
    });
  }
}
