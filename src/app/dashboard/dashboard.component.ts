import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, NgZone, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, catchError, defaultIfEmpty, finalize, map, of, switchMap, takeUntil, tap } from 'rxjs';
import { User } from '../core/models/auth.model';
import { ConsolidadoEstado, Dashboard, UsuarioEstadistica } from '../core/models/consolidado.model';
import { AuthService } from '../core/services/auth.service';
import { ConsolidadorResumen, DashboardService } from '../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="operations-dashboard">
      <header class="page-header">
        <div>
          <p class="eyebrow">Panel de operaciones</p>
          <h1>Seguimiento de Consolidación</h1>
          <p class="subtitle">Prioriza atrasos, distribuye la carga del equipo y revisa el avance de cada seguimiento.</p>
          <p class="update-status" role="status" aria-live="polite">
            @if (isInitialLoading) {
              Cargando información actualizada
            } @else if (isRefreshing) {
              Actualizando información
            } @else if (lastUpdated) {
              Última actualización: {{ lastUpdated | date: 'dd/MM/yyyy, HH:mm:ss' }}
            } @else {
              Aún no hay una actualización disponible
            }
          </p>
        </div>
        <button
          type="button"
          class="refresh-button"
          [disabled]="isInitialLoading || isRefreshing"
          [attr.aria-busy]="isRefreshing"
          (click)="cargarDashboard()"
        >
          <span class="refresh-mark" [class.is-spinning]="isRefreshing" aria-hidden="true"></span>
          {{ isRefreshing ? 'Actualizando' : 'Actualizar' }}
        </button>
      </header>

      @if (isInitialLoading) {
        <section class="state-panel" role="status" aria-live="polite">
          <span class="loader" aria-hidden="true"></span>
          <h2>Cargando tablero operativo</h2>
          <p>Estamos reuniendo los seguimientos, atrasos y datos del equipo.</p>
        </section>
      } @else if (mainError && !dashboard) {
        <section class="state-panel state-error" role="alert">
          <p class="state-kicker">No se pudo cargar el tablero</p>
          <h2>La información operativa no está disponible</h2>
          <p>{{ mainError }}</p>
          <button type="button" class="primary-button" (click)="cargarDashboard()">Reintentar</button>
        </section>
      } @else if (dashboard) {
        @if (mainError) {
          <div class="inline-alert" role="alert">
            <span>{{ mainError }} Los datos visibles corresponden a la última actualización correcta.</span>
            <button type="button" (click)="cargarDashboard()">Reintentar</button>
          </div>
        }

        @if (isDashboardEmpty) {
          <section class="state-panel state-empty">
            <p class="state-kicker">Sin registros</p>
            <h2>No hay seguimientos para mostrar</h2>
            <p>Cuando existan consolidados o registros de Café con Jesús, el resumen operativo aparecerá aquí.</p>
            <a routerLink="/consolidados" class="primary-button">Ir a consolidados</a>
          </section>
        } @else {
          <section aria-labelledby="atencion-title">
            <div class="section-heading compact-heading">
              <div>
                <p class="section-kicker">Atención inmediata</p>
                <h2 id="atencion-title">Qué necesita acción hoy</h2>
              </div>
            </div>
            <div class="attention-grid">
              <a routerLink="/consolidados-atrasos" class="attention-card attention-critical" data-testid="attention-overdue">
                <span class="attention-code" aria-hidden="true">01</span>
                <span class="attention-value">{{ dashboard.consolidadosAtrasados }}</span>
                <span class="attention-label">Con atrasos</span>
                <span class="attention-action">Revisar prioridades <span aria-hidden="true">→</span></span>
              </a>
              <a routerLink="/consolidados" class="attention-card attention-unassigned" data-testid="attention-unassigned">
                <span class="attention-code" aria-hidden="true">02</span>
                <span class="attention-value">{{ dashboard.consolidadosSinAsignar }}</span>
                <span class="attention-label">Sin asignar</span>
                <span class="attention-action">Gestionar asignaciones <span aria-hidden="true">→</span></span>
              </a>
              <a routerLink="/consolidados" class="attention-card attention-active" data-testid="attention-active">
                <span class="attention-code" aria-hidden="true">03</span>
                <span class="attention-value">{{ dashboard.consolidadosEnProceso }}</span>
                <span class="attention-label">Seguimientos activos</span>
                <span class="attention-action">Ver en proceso <span aria-hidden="true">→</span></span>
              </a>
            </div>
          </section>

          <div class="primary-layout">
            <section class="panel priority-panel" aria-labelledby="prioridad-title">
              <div class="section-heading">
                <div>
                  <p class="section-kicker">Cola prioritaria</p>
                  <h2 id="prioridad-title">Atrasos que requieren seguimiento</h2>
                  <p>Ordenados por mayor cantidad de días de atraso.</p>
                </div>
                <a routerLink="/consolidados-atrasos" class="text-link">Ver todos los atrasos</a>
              </div>

              @if (priorityQueue.length) {
                <ol class="priority-list">
                  @for (item of priorityQueue; track item.id; let position = $index) {
                    <li class="priority-item">
                      <span class="priority-position" aria-hidden="true">{{ position + 1 }}</span>
                      <div class="priority-person">
                        <strong>{{ item.titulo }}</strong>
                        <span>Responsable: {{ item.asignadoA || 'Sin responsable' }}</span>
                      </div>
                      <div class="priority-delay">
                        <strong>{{ item.diasDeAtraso }} día{{ item.diasDeAtraso === 1 ? '' : 's' }}</strong>
                        <span>{{ pendingCount(item) }} obligación{{ pendingCount(item) === 1 ? '' : 'es' }} pendiente{{ pendingCount(item) === 1 ? '' : 's' }}</span>
                      </div>
                      <a [routerLink]="['/consolidados', item.id]" class="row-action" [attr.aria-label]="'Abrir detalle de ' + item.titulo">Ver detalle</a>
                    </li>
                  }
                </ol>
              } @else {
                <div class="calm-state">
                  <strong>No hay seguimientos atrasados</strong>
                  <span>La cola prioritaria está al día.</span>
                </div>
              }
            </section>

            <aside class="panel quick-panel" aria-labelledby="quick-title">
              <p class="section-kicker">Accesos rápidos</p>
              <h2 id="quick-title">Reportes y análisis</h2>
              <nav aria-label="Accesos a reportes">
                <a routerLink="/reportes">
                  <span>Centro de informes</span>
                  <span aria-hidden="true">→</span>
                </a>
                <a routerLink="/reportes/cafe-con-jesus">
                  <span>Reporte Café con Jesús</span>
                  <span aria-hidden="true">→</span>
                </a>
                <a routerLink="/estadisticas-gdc">
                  <span>Estadísticas GDC</span>
                  <span aria-hidden="true">→</span>
                </a>
              </nav>
            </aside>
          </div>

          <section class="panel team-panel" aria-labelledby="equipo-title">
            <div class="section-heading">
              <div>
                <p class="section-kicker">Estado del equipo</p>
                <h2 id="equipo-title">Cumplimiento por consolidador</h2>
                <p>Selecciona una persona para abrir su cartera en este mismo tablero.</p>
              </div>
            </div>

            @if (teamStatistics.length) {
              <div class="table-scroll" tabindex="0" aria-label="Tabla desplazable de cumplimiento por consolidador">
                <table class="operations-table team-table">
                  <caption>Asignaciones y cumplimiento del equipo de consolidación</caption>
                  <thead>
                    <tr>
                      <th scope="col">Consolidador</th>
                      <th scope="col">Asignados</th>
                      <th scope="col">Al día</th>
                      <th scope="col">Con atraso</th>
                      <th scope="col">Cumplimiento</th>
                      <th scope="col"><span class="sr-only">Acción</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (stat of teamStatistics; track stat.username) {
                      <tr [class.selected-row]="usernameSeleccionado === stat.username">
                        <th scope="row">
                          <span class="person-name">{{ stat.username }}</span>
                          <span class="person-email">{{ stat.email || 'Sin correo registrado' }}</span>
                        </th>
                        <td data-label="Asignados">{{ stat.totalAsignados }}</td>
                        <td data-label="Al día" class="positive-value">{{ stat.alDia }}</td>
                        <td data-label="Con atraso" [class.negative-value]="stat.conAtrasos > 0">{{ stat.conAtrasos }}</td>
                        <td data-label="Cumplimiento">
                          <div
                            class="compliance-progress"
                            role="progressbar"
                            [attr.aria-label]="'Cumplimiento de ' + stat.username"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            [attr.aria-valuenow]="compliance(stat)"
                          >
                            <span class="progress-track"><span class="progress-fill" [style.width.%]="compliance(stat)"></span></span>
                            <strong>{{ compliance(stat) }}%</strong>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            class="table-action"
                            [attr.aria-pressed]="usernameSeleccionado === stat.username"
                            (click)="seleccionarConsolidador(stat.username)"
                          >Ver cartera</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="calm-state">
                <strong>Sin datos por consolidador</strong>
                <span>El resumen del equipo todavía no tiene asignaciones.</span>
              </div>
            }
          </section>

          <section id="cartera-equipo" class="panel portfolio-panel" aria-labelledby="cartera-title">
            <div class="section-heading portfolio-heading">
              <div>
                <p class="section-kicker">Detalle secundario</p>
                <h2 id="cartera-title">Cartera de consolidador</h2>
                <p>Consulta Café con Jesús y consolidados asignados sin salir del tablero.</p>
              </div>
              <div class="portfolio-selector">
                <label for="consolidador-select">Consolidador</label>
                <select
                  id="consolidador-select"
                  [(ngModel)]="usernameSeleccionado"
                  (ngModelChange)="onSeleccionarConsolidador()"
                >
                  <option value="">Selecciona una persona</option>
                  @for (username of consolidadoresDisponibles; track username) {
                    <option [value]="username">{{ username }}</option>
                  }
                </select>
              </div>
            </div>

            @if (userListError) {
              <div class="inline-alert user-alert" role="alert">
                <span>{{ userListError }}</span>
                <button type="button" (click)="cargarUsuarios()">Reintentar usuarios</button>
              </div>
            }

            @if (!usernameSeleccionado && !isLoadingResumen) {
              <div class="portfolio-prompt">Selecciona un consolidador desde la tabla o el selector para revisar su cartera.</div>
            }

            @if (isLoadingResumen) {
              <div class="portfolio-loading" role="status" aria-live="polite">
                <span class="loader small-loader" aria-hidden="true"></span>
                Cargando cartera de {{ usernameSeleccionado }}
              </div>
            } @else if (selectedSummaryError) {
              <div class="inline-alert" role="alert">
                <span>{{ selectedSummaryError }}</span>
                <button type="button" (click)="reintentarResumen()">Reintentar cartera</button>
              </div>
            } @else if (resumenConsolidador) {
              <div class="portfolio-metrics">
                <div><span>Café con Jesús</span><strong>{{ resumenConsolidador.totalCafes }}</strong></div>
                <div><span>Consolidados</span><strong>{{ resumenConsolidador.totalConsolidados }}</strong></div>
                <div><span>Total personas</span><strong>{{ resumenConsolidador.totalCafes + resumenConsolidador.totalConsolidados }}</strong></div>
              </div>

              <div class="portfolio-block">
                <h3>Café con Jesús <span>{{ resumenConsolidador.totalCafes }}</span></h3>
                @if (resumenConsolidador.cafes?.length) {
                  <div class="table-scroll" tabindex="0" aria-label="Tabla desplazable de Café con Jesús">
                    <table class="operations-table detail-table">
                      <caption>Cartera de Café con Jesús de {{ resumenConsolidador.username }}</caption>
                      <thead>
                        <tr>
                          <th scope="col">Nombre</th>
                          <th scope="col">Teléfono</th>
                          <th scope="col">Edad</th>
                          <th scope="col">Invitado por</th>
                          <th scope="col">Ingreso</th>
                          <th scope="col">Asistió</th>
                          <th scope="col">Comentario</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (cafe of resumenConsolidador.cafes; track cafe.id) {
                          <tr>
                            <th scope="row">{{ cafe.nombre }} {{ cafe.apellido }}</th>
                            <td>{{ cafe.telefono || '—' }}</td>
                            <td>{{ cafe.edad || '—' }}</td>
                            <td>{{ cafe.invitadoPor || '—' }}</td>
                            <td>{{ cafe.fechaIngreso | date: 'dd/MM/yyyy' }}</td>
                            <td><span class="status-pill" [class.status-positive]="cafe.asistio">{{ cafe.asistio ? 'Sí' : 'No' }}</span></td>
                            <td class="comment-cell">{{ cafe.comentario || '—' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <p class="block-empty">No tiene personas asignadas en Café con Jesús.</p>
                }
              </div>

              <div class="portfolio-block">
                <h3>Consolidados <span>{{ resumenConsolidador.totalConsolidados }}</span></h3>
                @if (resumenConsolidador.consolidados?.length) {
                  <div class="table-scroll" tabindex="0" aria-label="Tabla desplazable de consolidados asignados">
                    <table class="operations-table detail-table">
                      <caption>Consolidados asignados a {{ resumenConsolidador.username }}</caption>
                      <thead>
                        <tr>
                          <th scope="col">Nombre</th>
                          <th scope="col">Teléfono</th>
                          <th scope="col">Edad</th>
                          <th scope="col">Quién invitó</th>
                          <th scope="col">Ingreso</th>
                          <th scope="col">Estado</th>
                          <th scope="col"><span class="sr-only">Acción</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (consolidado of resumenConsolidador.consolidados; track consolidado.id) {
                          <tr>
                            <th scope="row">{{ consolidado.nombre }}</th>
                            <td>{{ consolidado.telefono || '—' }}</td>
                            <td>{{ consolidado.edad || '—' }}</td>
                            <td>{{ consolidado.quienInvito || '—' }}</td>
                            <td>{{ consolidado.fechaIngreso | date: 'dd/MM/yyyy' }}</td>
                            <td><span class="status-pill">{{ estadoLabel(consolidado.estado) }}</span></td>
                            <td><a [routerLink]="['/consolidados', consolidado.id]" class="row-action" [attr.aria-label]="'Abrir detalle de ' + consolidado.nombre">Ver detalle</a></td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <p class="block-empty">No tiene consolidados asignados.</p>
                }
              </div>
            }
          </section>

          <div class="secondary-layout">
            <section class="panel lifecycle-panel" aria-labelledby="ciclo-title">
              <div class="section-heading compact-heading">
                <div>
                  <p class="section-kicker">Vista general</p>
                  <h2 id="ciclo-title">Totales del ciclo</h2>
                </div>
              </div>
              <dl class="lifecycle-grid">
                <div><dt>Total consolidados</dt><dd>{{ dashboard.totalConsolidados }}</dd></div>
                <div><dt>Al día</dt><dd>{{ dashboard.consolidadosAlDia }}</dd></div>
                <div><dt>Con GDC</dt><dd>{{ dashboard.consolidadosConGDC }}</dd></div>
                <div><dt>Cerrados sin GDC</dt><dd>{{ dashboard.consolidadosCerrados }}</dd></div>
                <div><dt>Café con Jesús</dt><dd>{{ dashboard.totalCafeConJesus }}</dd></div>
              </dl>
            </section>

            <section class="panel meetings-panel" aria-labelledby="reuniones-title">
              <div class="section-heading compact-heading">
                <div>
                  <p class="section-kicker">Distribución</p>
                  <h2 id="reuniones-title">Consolidados por reunión</h2>
                </div>
              </div>
              @if (dashboard.estadisticasPorReunion?.length) {
                <ul class="meeting-list">
                  @for (reunion of dashboard.estadisticasPorReunion; track reunion.nombreReunion) {
                    <li><span>{{ reunion.nombreReunion }}</span><strong>{{ reunion.totalConsolidados }}</strong></li>
                  }
                </ul>
              } @else {
                <p class="block-empty">No hay distribución por reunión disponible.</p>
              }
            </section>
          </div>
        }
      }
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
      color: #172033;
    }

    * { box-sizing: border-box; }

    .operations-dashboard {
      width: min(1480px, 100%);
      margin: 0 auto;
      padding: 32px clamp(18px, 3vw, 44px) 56px;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 28px;
      margin-bottom: 30px;
      padding: clamp(24px, 4vw, 42px);
      color: #fff;
      background: linear-gradient(125deg, #0d2746 0%, #153c66 62%, #1f5575 100%);
      border-radius: 8px 8px 28px 8px;
      box-shadow: 0 18px 45px rgba(13, 39, 70, .18);
    }

    .eyebrow, .section-kicker, .state-kicker {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
    }

    .eyebrow { color: #9fd6e7; }
    .page-header h1 { margin: 0; font-size: clamp(28px, 4vw, 46px); line-height: 1.06; letter-spacing: -.035em; }
    .subtitle { max-width: 760px; margin: 14px 0 0; color: #d7e7f2; font-size: clamp(14px, 1.7vw, 17px); line-height: 1.55; }
    .update-status { margin: 18px 0 0; color: #aac6d9; font-size: 13px; }

    button, a, select { font: inherit; }
    a { color: inherit; }

    .refresh-button, .primary-button {
      min-height: 46px;
      padding: 0 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border: 1px solid transparent;
      border-radius: 9px;
      font-weight: 750;
      text-decoration: none;
      cursor: pointer;
    }

    .refresh-button { flex: 0 0 auto; color: #0d2746; background: #fff; border-color: rgba(255,255,255,.7); }
    .refresh-button:disabled { opacity: .72; cursor: wait; }
    .refresh-mark { width: 14px; height: 14px; border: 2px solid #7b99ac; border-top-color: #0d2746; border-radius: 50%; }
    .refresh-mark.is-spinning, .loader { animation: spin .8s linear infinite; }
    .primary-button { margin-top: 8px; color: #fff; background: #174f7b; border-color: #174f7b; }

    .state-panel {
      min-height: 330px;
      padding: 48px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: #fff;
      border: 1px solid #dce4ea;
      border-radius: 18px;
    }

    .state-panel h2 { margin: 14px 0 8px; font-size: 24px; }
    .state-panel p { max-width: 560px; margin: 0 0 14px; color: #607080; line-height: 1.6; }
    .state-error { border-top: 4px solid #ad3f3f; }
    .state-empty { border-top: 4px solid #72899a; }
    .state-kicker { color: #8d3d3d !important; }
    .loader { width: 38px; height: 38px; border: 3px solid #dce5eb; border-top-color: #174f7b; border-radius: 50%; }
    .small-loader { width: 22px; height: 22px; border-width: 2px; }

    .inline-alert {
      min-height: 48px;
      margin-bottom: 20px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      color: #742f2f;
      background: #fff5f3;
      border: 1px solid #e8c5bf;
      border-radius: 9px;
      font-size: 14px;
    }

    .inline-alert button { min-height: 36px; padding: 5px 12px; color: #742f2f; background: #fff; border: 1px solid #d8a8a1; border-radius: 7px; font-weight: 700; cursor: pointer; }
    .section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
    .compact-heading { margin-bottom: 16px; }
    .section-kicker { color: #42708f; }
    .section-heading h2, .quick-panel h2 { margin: 0; color: #12263a; font-size: clamp(20px, 2.2vw, 26px); letter-spacing: -.02em; }
    .section-heading p:not(.section-kicker) { margin: 7px 0 0; color: #6c7985; font-size: 14px; }

    .attention-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
    .attention-card {
      min-height: 168px;
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-areas: 'code value' 'label label' 'action action';
      color: #172033;
      background: #fff;
      border: 1px solid #d9e2e9;
      border-top: 4px solid #55758a;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 9px 25px rgba(18, 38, 58, .06);
      transition: transform .18s ease, box-shadow .18s ease;
    }

    .attention-card:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(18, 38, 58, .11); }
    .attention-critical { border-top-color: #b44b45; }
    .attention-unassigned { border-top-color: #b17b2c; }
    .attention-active { border-top-color: #267483; }
    .attention-code { grid-area: code; color: #8796a2; font-size: 12px; font-weight: 800; letter-spacing: .1em; }
    .attention-value { grid-area: value; font-size: 38px; font-weight: 850; line-height: .9; }
    .attention-label { grid-area: label; align-self: end; margin-top: 18px; font-size: 17px; font-weight: 800; }
    .attention-action { grid-area: action; margin-top: 10px; color: #597083; font-size: 13px; font-weight: 700; }

    .panel { min-width: 0; padding: clamp(20px, 2.5vw, 28px); background: #fff; border: 1px solid #d9e2e9; border-radius: 14px; box-shadow: 0 9px 25px rgba(18, 38, 58, .05); }
    .primary-layout { display: grid; grid-template-columns: minmax(0, 2.25fr) minmax(250px, .75fr); gap: 20px; margin-bottom: 20px; }
    .text-link { min-height: 44px; display: inline-flex; align-items: center; color: #174f7b; font-size: 14px; font-weight: 750; white-space: nowrap; }

    .priority-list { padding: 0; margin: 0; list-style: none; border-top: 1px solid #e5eaee; }
    .priority-item { min-height: 82px; display: grid; grid-template-columns: 28px minmax(180px, 1.4fr) minmax(145px, .8fr) auto; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid #e5eaee; }
    .priority-position { width: 25px; height: 25px; display: grid; place-items: center; color: #557083; background: #edf3f6; border-radius: 50%; font-size: 12px; font-weight: 800; }
    .priority-person, .priority-delay { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .priority-person strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .priority-person span, .priority-delay span { color: #73808b; font-size: 12px; }
    .priority-delay strong { color: #9b3f3b; font-size: 14px; }
    .row-action, .table-action { min-height: 40px; display: inline-flex; align-items: center; justify-content: center; padding: 7px 12px; color: #174f7b; background: #edf5f8; border: 1px solid #c9dce5; border-radius: 7px; font-size: 13px; font-weight: 750; text-decoration: none; white-space: nowrap; cursor: pointer; }

    .quick-panel { background: #f4f7f8; }
    .quick-panel nav { margin-top: 20px; display: grid; gap: 8px; }
    .quick-panel nav a { min-height: 52px; padding: 11px 13px; display: flex; justify-content: space-between; align-items: center; gap: 12px; background: #fff; border: 1px solid #d9e2e9; border-radius: 8px; color: #25425b; font-size: 13px; font-weight: 750; text-decoration: none; }
    .quick-panel nav a:hover { border-color: #7da3b9; }
    .calm-state, .portfolio-prompt, .portfolio-loading, .block-empty { padding: 26px 18px; color: #647480; background: #f7f9fa; border: 1px dashed #cad5dc; border-radius: 9px; text-align: center; }
    .calm-state { display: flex; flex-direction: column; gap: 5px; }
    .calm-state strong { color: #29475c; }

    .team-panel, .portfolio-panel { margin-bottom: 20px; }
    .table-scroll { max-width: 100%; overflow-x: auto; border: 1px solid #dfe6eb; border-radius: 9px; scrollbar-gutter: stable; }
    .operations-table { width: 100%; min-width: 780px; border-collapse: collapse; background: #fff; }
    .operations-table caption { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .operations-table thead { background: #f3f6f8; }
    .operations-table th, .operations-table td { padding: 13px 15px; text-align: left; border-bottom: 1px solid #e4e9ed; font-size: 14px; }
    .operations-table thead th { color: #62717d; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    .operations-table tbody th { font-weight: 700; }
    .operations-table tbody tr:last-child > * { border-bottom: 0; }
    .operations-table tbody tr:hover, .operations-table .selected-row { background: #f3f8fa; }
    .person-name, .person-email { display: block; }
    .person-email { max-width: 250px; margin-top: 3px; overflow: hidden; color: #7a8791; font-size: 12px; font-weight: 400; text-overflow: ellipsis; }
    .positive-value { color: #26705e; font-weight: 800; }
    .negative-value { color: #a43f3f; font-weight: 800; }
    .compliance-progress { min-width: 145px; display: flex; align-items: center; gap: 9px; }
    .progress-track { flex: 1; height: 7px; overflow: hidden; background: #dfe7eb; border-radius: 10px; }
    .progress-fill { display: block; height: 100%; background: #2c7881; border-radius: inherit; transition: width .25s ease; }
    .compliance-progress strong { width: 38px; font-size: 12px; text-align: right; }

    .portfolio-heading { align-items: end; }
    .portfolio-selector { width: min(320px, 100%); flex: 0 0 auto; }
    .portfolio-selector label { display: block; margin-bottom: 6px; color: #536879; font-size: 12px; font-weight: 800; }
    .portfolio-selector select { width: 100%; min-height: 44px; padding: 8px 36px 8px 11px; color: #172033; background: #fff; border: 1px solid #bfcdd6; border-radius: 8px; }
    .user-alert { margin-top: -6px; }
    .portfolio-loading { display: flex; align-items: center; justify-content: center; gap: 12px; }
    .portfolio-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 18px 0; }
    .portfolio-metrics div { padding: 15px; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #f3f6f8; border-left: 3px solid #4b788f; border-radius: 6px; }
    .portfolio-metrics span { color: #667682; font-size: 13px; }
    .portfolio-metrics strong { font-size: 24px; }
    .portfolio-block { margin-top: 18px; }
    .portfolio-block h3 { margin: 0 0 10px; font-size: 17px; }
    .portfolio-block h3 span { margin-left: 7px; padding: 2px 8px; color: #456174; background: #e8eff3; border-radius: 20px; font-size: 12px; }
    .detail-table { min-width: 900px; }
    .comment-cell { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .status-pill { display: inline-flex; padding: 4px 8px; color: #6b4b24; background: #fbf1df; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; white-space: nowrap; }
    .status-positive { color: #23604f; background: #e3f2ed; }
    .block-empty { margin: 0; padding: 20px; }

    .secondary-layout { display: grid; grid-template-columns: 1.2fr .8fr; gap: 20px; }
    .lifecycle-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; margin: 0; overflow: hidden; background: #dce4e9; border: 1px solid #dce4e9; border-radius: 9px; }
    .lifecycle-grid div { min-width: 0; padding: 16px 12px; display: flex; flex-direction: column-reverse; gap: 7px; background: #f8fafb; }
    .lifecycle-grid dt { color: #697984; font-size: 11px; line-height: 1.3; }
    .lifecycle-grid dd { margin: 0; font-size: 25px; font-weight: 850; }
    .meeting-list { padding: 0; margin: 0; list-style: none; }
    .meeting-list li { min-height: 43px; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 1px solid #e3e9ed; font-size: 14px; }
    .meeting-list li:last-child { border-bottom: 0; }
    .meeting-list strong { color: #174f7b; }

    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    button:focus-visible, a:focus-visible, select:focus-visible, .table-scroll:focus-visible { outline: 3px solid #4c9bc1; outline-offset: 3px; }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1050px) {
      .primary-layout, .secondary-layout { grid-template-columns: 1fr; }
      .lifecycle-grid { grid-template-columns: repeat(5, minmax(105px, 1fr)); overflow-x: auto; }
    }

    @media (max-width: 760px) {
      .operations-dashboard { padding: 16px 12px 38px; }
      .page-header { flex-direction: column; padding: 24px 20px; border-radius: 6px 6px 20px 6px; }
      .refresh-button { width: 100%; }
      .attention-grid { grid-template-columns: 1fr; gap: 10px; }
      .attention-card { min-height: 112px; padding: 15px 17px; grid-template-areas: 'label value' 'action action'; }
      .attention-code { display: none; }
      .attention-label { align-self: center; margin: 0; }
      .attention-value { font-size: 32px; }
      .attention-action { margin-top: 7px; }
      .section-heading, .portfolio-heading { flex-direction: column; align-items: stretch; }
      .text-link { align-self: flex-start; }
      .priority-item { grid-template-columns: 25px 1fr auto; gap: 10px; }
      .priority-delay { grid-column: 2 / -1; flex-direction: row; justify-content: space-between; gap: 12px; }
      .priority-item .row-action { grid-column: 2 / -1; width: 100%; }
      .portfolio-selector { width: 100%; }
      .portfolio-metrics { grid-template-columns: 1fr; }
      .inline-alert { align-items: stretch; flex-direction: column; }
      .inline-alert button { width: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly destroy$ = new Subject<void>();
  private readonly userRequests$ = new Subject<void>();
  private readonly selectedUserRequests$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private dashboardRequest?: Subscription;
  private dashboardSequence = 0;
  private readonly dashboardState = signal<Dashboard | null>(null);
  private readonly lastUpdatedState = signal<Date | null>(null);
  private readonly initialLoadingState = signal(true);
  private readonly refreshingState = signal(false);
  private readonly mainErrorState = signal('');

  usuarios: User[] = [];
  usernameSeleccionado = '';
  resumenConsolidador: ConsolidadorResumen | null = null;
  isLoadingUsers = false;
  isLoadingResumen = false;
  userListError = '';
  selectedSummaryError = '';

  get dashboard(): Dashboard | null { return this.dashboardState(); }
  set dashboard(value: Dashboard | null) { this.dashboardState.set(value); }
  get lastUpdated(): Date | null { return this.lastUpdatedState(); }
  private set lastUpdated(value: Date | null) { this.lastUpdatedState.set(value); }
  get isInitialLoading(): boolean { return this.initialLoadingState(); }
  private set isInitialLoading(value: boolean) { this.initialLoadingState.set(value); }
  get isRefreshing(): boolean { return this.refreshingState(); }
  private set isRefreshing(value: boolean) { this.refreshingState.set(value); }
  get mainError(): string { return this.mainErrorState(); }
  private set mainError(value: string) { this.mainErrorState.set(value); }

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
  ) {
    this.destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  ngOnInit(): void {
    this.bindUserRequests();
    this.bindSelectedUserRequests();
    this.cargarDashboard();
    this.cargarUsuarios();
  }

  get isDashboardEmpty(): boolean {
    return !!this.dashboard
      && this.dashboard.totalConsolidados === 0
      && this.dashboard.totalCafeConJesus === 0;
  }

  get priorityQueue(): ConsolidadoEstado[] {
    return [...(this.dashboard?.consolidadosConAtrasos ?? [])]
      .sort((a, b) => b.diasDeAtraso - a.diasDeAtraso)
      .slice(0, 5);
  }

  get teamStatistics(): UsuarioEstadistica[] {
    return this.dashboard?.estadisticasPorUsuario ?? [];
  }

  get consolidadoresDisponibles(): string[] {
    const usernames = [
      ...this.teamStatistics.map(stat => stat.username),
      ...this.usuarios.map(user => user.username),
    ].filter(Boolean);
    return [...new Set(usernames)].sort((a, b) => a.localeCompare(b, 'es'));
  }

  cargarDashboard(): void {
    const sequence = ++this.dashboardSequence;
    this.dashboardRequest?.unsubscribe();
    this.mainError = '';
    this.isInitialLoading = !this.dashboard;
    this.isRefreshing = !!this.dashboard;
    const error = 'No fue posible obtener la información del dashboard.';
    this.dashboardRequest = this.dashboardService.getDashboard().pipe(
      map(data => data ? { data, error: '' } : { data: null, error }),
      defaultIfEmpty({ data: null, error }),
      catchError(() => of({ data: null, error })),
      finalize(() => {
        if (sequence !== this.dashboardSequence) return;
        this.ngZone.run(() => {
          this.isInitialLoading = false;
          this.isRefreshing = false;
          if (!this.destroyRef.destroyed) this.changeDetector.detectChanges();
        });
      }),
      takeUntil(this.destroy$),
    ).subscribe(result => {
      if (sequence !== this.dashboardSequence) return;
      this.ngZone.run(() => {
        this.mainError = result.error;
        if (result.data) {
          this.dashboard = result.data;
          this.lastUpdated = new Date();
        }
      });
    });
  }

  cargarUsuarios(): void {
    this.userRequests$.next();
  }

  onSeleccionarConsolidador(): void {
    this.selectedUserRequests$.next(this.usernameSeleccionado);
  }

  seleccionarConsolidador(username: string): void {
    this.usernameSeleccionado = username;
    this.selectedUserRequests$.next(username);
  }

  reintentarResumen(): void {
    this.selectedUserRequests$.next(this.usernameSeleccionado);
  }

  compliance(stat: UsuarioEstadistica): number {
    if (!stat.totalAsignados) return 0;
    return Math.max(0, Math.min(100, Math.round((stat.alDia / stat.totalAsignados) * 100)));
  }

  pendingCount(item: ConsolidadoEstado): number {
    return item.comentariosPendientes?.length ?? 0;
  }

  estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      ASIGNADO: 'Asignado',
      EN_PROCESO: 'En proceso',
      PENDIENTE: 'Pendiente',
      GDC: 'En GDC',
      CERRADO: 'Cerrado',
    };
    return labels[estado] ?? estado;
  }

  private bindUserRequests(): void {
    this.userRequests$.pipe(
      tap(() => {
        this.isLoadingUsers = true;
        this.userListError = '';
      }),
      switchMap(() => this.authService.getAllUsers().pipe(
        map(users => ({ users, error: '' })),
        catchError(() => of({ users: [] as User[], error: 'No se pudo cargar la lista completa de usuarios.' })),
      )),
      takeUntil(this.destroy$),
    ).subscribe(result => {
      this.ngZone.run(() => {
        this.isLoadingUsers = false;
        this.usuarios = result.users;
        this.userListError = result.error;
      });
    });
  }

  private bindSelectedUserRequests(): void {
    this.selectedUserRequests$.pipe(
      tap(username => {
        this.isLoadingResumen = !!username;
        this.resumenConsolidador = null;
        this.selectedSummaryError = '';
      }),
      switchMap(username => {
        if (!username) return of({ summary: null, error: '' });
        return this.dashboardService.getResumenConsolidador(username).pipe(
          map(summary => ({ summary, error: '' })),
          catchError(() => of({ summary: null, error: `No fue posible cargar la cartera de ${username}.` })),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe(result => {
      this.ngZone.run(() => {
        this.isLoadingResumen = false;
        this.resumenConsolidador = result.summary;
        this.selectedSummaryError = result.error;
      });
    });
  }
}
