import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, Observable } from 'rxjs';
import { EncuentroAsignacionMentor, EncuentroMentorOpcion } from '../../../core/models/encuentro-mentoria.model';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';

@Component({
  selector: 'app-encuentro-mentor-assignment',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="assignment-panel">
      <header>
        <div><span>Mentoría</span><h2>Asignación de participantes</h2></div>
        <div class="summary"><strong>{{ sinMentor() }}</strong> sin mentor</div>
      </header>

      @if (error()) {<p class="error" role="alert">{{ error() }} <button type="button" (click)="cargar()">Reintentar</button></p>}
      @if (cargando()) {
        <p class="state">Cargando asignaciones...</p>
      } @else if (!error()) {
        <section class="mentor-summary" aria-labelledby="mentor-summary-title">
          <div class="mentor-summary-heading">
            <div><span>Este ciclo</span><h3 id="mentor-summary-title">Personas asignadas por mentor</h3></div>
            <strong>{{ asignaciones().length - sinMentor() }}</strong>
          </div>
          <div class="mentor-summary-grid">
            @for (item of resumenMentores(); track item.mentor.id) {
              <article>
                <span>{{ item.mentor.nombreCompleto }}</span>
                <strong>{{ item.cantidad }}</strong>
              </article>
            } @empty {
              <p class="state">No hay mentores habilitados.</p>
            }
          </div>
        </section>

        @if (!asignaciones().length) {
          <p class="state">Este ciclo todavía no tiene participantes inscritos.</p>
        } @else {
          <div class="filter-row">
            <div class="filter-control search-control">
              <label for="buscarParticipante">Buscar participante</label>
              <input
                id="buscarParticipante"
                type="search"
                placeholder="Nombre o teléfono"
                [ngModel]="busqueda()"
                (ngModelChange)="busqueda.set($event)">
            </div>
            <div class="filter-control">
              <label for="filtroMentor">Filtrar asignaciones</label>
              <select id="filtroMentor" [ngModel]="filtro()" (ngModelChange)="filtro.set($event)">
                <option value="TODOS">Todos los participantes</option>
                <option value="SIN_MENTOR">Sin mentor</option>
                @for (mentor of mentores(); track mentor.id) {<option [value]="mentor.id.toString()">{{ mentor.nombreCompleto }}</option>}
              </select>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead><tr><th>Participante</th><th>Teléfono</th><th>Mentor actual</th><th>Asignar / reasignar</th></tr></thead>
              <tbody>
                @for (item of asignacionesFiltradas(); track item.inscripcionId) {
                  <tr>
                    <td><strong>{{ item.nombreCompleto }}</strong></td>
                    <td>{{ item.telefono }}</td>
                    <td><span class="mentor-badge" [class.unassigned]="!item.mentor">{{ item.mentor?.nombreCompleto || 'Sin mentor' }}</span></td>
                    <td>
                      <select
                        aria-label="Mentor de {{ item.nombreCompleto }}"
                        [ngModel]="item.mentor?.id?.toString() || ''"
                        (ngModelChange)="cambiarMentor(item, $event)"
                        [disabled]="guardando().has(item.inscripcionId)">
                        <option value="">Sin mentor</option>
                        @for (mentor of mentores(); track mentor.id) {<option [value]="mentor.id.toString()">{{ mentor.nombreCompleto }}</option>}
                      </select>
                      @if (guardando().has(item.inscripcionId)) {<small>Guardando...</small>}
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="state">No hay participantes que coincidan con la búsqueda y el filtro.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    :host{display:block}.assignment-panel{margin:0 0 18px;padding:20px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px}.assignment-panel>header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}.assignment-panel header span{color:#60a5fa;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.assignment-panel h2{margin:4px 0 0;font-size:20px}.summary{padding:10px 14px;background:rgba(245,158,11,.12);border-radius:10px;color:var(--text-secondary);font-size:13px}.summary strong{color:#f59e0b;font-size:19px}.filter-row{display:flex;align-items:end;gap:12px;margin-bottom:14px}.filter-row label{display:grid;gap:6px;color:var(--text-secondary);font-size:12px;font-weight:700}.filter-row select,td select{min-width:220px;padding:9px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary)}.table-wrap{overflow-x:auto;border:1px solid var(--border-color);border-radius:10px}table{width:100%;border-collapse:collapse}th,td{padding:12px 14px;text-align:left;border-bottom:1px solid var(--border-color)}th{color:var(--text-muted);font-size:11px;text-transform:uppercase}td{color:var(--text-primary);font-size:13px}td small{display:block;margin-top:5px;color:#60a5fa}.mentor-badge{display:inline-block;padding:5px 9px;border-radius:999px;background:rgba(16,185,129,.12);color:#34d399;font-size:12px;font-weight:700}.mentor-badge.unassigned{background:rgba(245,158,11,.12);color:#fbbf24}.state{padding:22px;text-align:center;color:var(--text-muted)}.error{padding:12px;background:rgba(239,68,68,.1);border-radius:8px;color:#f87171}.error button{border:0;background:none;color:inherit;font-weight:800;text-decoration:underline;cursor:pointer}@media(max-width:650px){.assignment-panel>header{align-items:start}.summary{display:none}.filter-row,.filter-row label,.filter-row select{width:100%}th:nth-child(2),td:nth-child(2){display:none}th,td{padding:10px}td select{min-width:170px;max-width:190px}}
  `, `
    .mentor-summary{margin-bottom:18px;padding:16px;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-secondary)}
    .mentor-summary-heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:12px}
    .mentor-summary-heading span{color:#60a5fa;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}
    .mentor-summary-heading h3{margin:3px 0 0;font-size:16px}
    .mentor-summary-heading>strong{color:#60a5fa;font-size:26px}
    .mentor-summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
    .mentor-summary-grid article{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:9px}
    .mentor-summary-grid article span{overflow:hidden;color:var(--text-secondary);font-size:13px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}
    .mentor-summary-grid article strong{flex:0 0 auto;font-size:24px}
    .mentor-summary-grid .state{grid-column:1/-1}
    .filter-control{display:grid;gap:6px;color:var(--text-secondary);font-size:12px;font-weight:700}
    .filter-control input{min-width:280px;padding:9px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary)}
    .search-control{flex:1;max-width:420px}
    .search-control input{width:100%}
    @media(max-width:650px){.mentor-summary-grid{grid-template-columns:1fr 1fr}.filter-control,.filter-control input{width:100%;min-width:0}.search-control{max-width:none}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncuentroMentorAssignmentComponent {
  private readonly service = inject(EncuentroMentoriaService);

  readonly cicloId = input.required<number>();
  readonly asignaciones = signal<EncuentroAsignacionMentor[]>([]);
  readonly mentores = signal<EncuentroMentorOpcion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly filtro = signal('TODOS');
  readonly busqueda = signal('');
  readonly guardando = signal<ReadonlySet<number>>(new Set());
  readonly sinMentor = computed(() => this.asignaciones().filter(item => !item.mentor).length);
  readonly resumenMentores = computed(() => {
    const mentores = new Map(this.mentores().map(mentor => [mentor.id, mentor]));
    const cantidades = new Map<number, number>();
    for (const asignacion of this.asignaciones()) {
      if (!asignacion.mentor) continue;
      mentores.set(asignacion.mentor.id, asignacion.mentor);
      cantidades.set(asignacion.mentor.id, (cantidades.get(asignacion.mentor.id) ?? 0) + 1);
    }
    return [...mentores.values()]
      .map(mentor => ({ mentor, cantidad: cantidades.get(mentor.id) ?? 0 }))
      .sort((a, b) => b.cantidad - a.cantidad
        || a.mentor.nombreCompleto.localeCompare(b.mentor.nombreCompleto, 'es', { sensitivity: 'base' }));
  });
  readonly asignacionesFiltradas = computed(() => {
    const filtro = this.filtro();
    const termino = this.busqueda().trim().toLocaleLowerCase('es');
    let asignaciones = this.asignaciones();
    if (filtro === 'SIN_MENTOR') asignaciones = asignaciones.filter(item => !item.mentor);
    else if (filtro !== 'TODOS') {
      const mentorId = Number(filtro);
      asignaciones = asignaciones.filter(item => item.mentor?.id === mentorId);
    }
    if (!termino) return asignaciones;
    return asignaciones.filter(item => `${item.nombreCompleto} ${item.telefono}`
      .toLocaleLowerCase('es').includes(termino));
  });

  constructor() {
    effect(onCleanup => {
      const cicloId = this.cicloId();
      this.filtro.set('TODOS');
      this.busqueda.set('');
      this.cargando.set(true);
      this.error.set('');
      const subscription = forkJoin({
        asignaciones: this.service.asignaciones(cicloId),
        mentores: this.service.mentoresHabilitados(),
      }).pipe(finalize(() => this.cargando.set(false))).subscribe({
        next: ({ asignaciones, mentores }) => {
          this.asignaciones.set(asignaciones);
          this.mentores.set(mentores);
        },
        error: error => this.error.set(this.mensajeError(error, 'No fue posible cargar las asignaciones de mentoría.')),
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  cargar(): void {
    const cicloId = this.cicloId();
    this.cargando.set(true);
    this.error.set('');
    forkJoin({
      asignaciones: this.service.asignaciones(cicloId),
      mentores: this.service.mentoresHabilitados(),
    }).pipe(finalize(() => this.cargando.set(false))).subscribe({
      next: ({ asignaciones, mentores }) => {
        if (this.cicloId() !== cicloId) return;
        this.asignaciones.set(asignaciones);
        this.mentores.set(mentores);
      },
      error: error => this.error.set(this.mensajeError(error, 'No fue posible cargar las asignaciones de mentoría.')),
    });
  }

  cambiarMentor(item: EncuentroAsignacionMentor, value: string): void {
    if (this.guardando().has(item.inscripcionId)) return;
    const mentorId = value ? Number(value) : null;
    if (mentorId === item.mentor?.id || (mentorId === null && !item.mentor)) return;
    const cicloId = this.cicloId();
    this.guardando.update(actual => new Set(actual).add(item.inscripcionId));
    this.error.set('');
    const request: Observable<EncuentroAsignacionMentor | null> = mentorId === null
      ? this.service.desasignarMentor(item.inscripcionId)
      : this.service.asignarMentor(item.inscripcionId, mentorId);
    request.pipe(finalize(() => this.guardando.update(actual => {
      const siguiente = new Set(actual);
      siguiente.delete(item.inscripcionId);
      return siguiente;
    }))).subscribe({
      next: response => {
        if (this.cicloId() !== cicloId) return;
        this.asignaciones.update(actual => actual.map(asignacion => asignacion.inscripcionId === item.inscripcionId
          ? (response ?? { ...asignacion, mentor: null })
          : asignacion));
      },
      error: error => this.error.set(this.mensajeError(error, 'No fue posible actualizar la asignación.')),
    });
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object'
      && typeof error.error.message === 'string') return error.error.message;
    return fallback;
  }
}
