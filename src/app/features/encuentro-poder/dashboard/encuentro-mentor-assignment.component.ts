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
      } @else if (!error() && !asignaciones().length) {
        <p class="state">Este ciclo todavía no tiene participantes inscritos.</p>
      } @else if (!error()) {
        <div class="filter-row">
          <label for="filtroMentor">Filtrar asignaciones</label>
          <select id="filtroMentor" [ngModel]="filtro()" (ngModelChange)="filtro.set($event)">
            <option value="TODOS">Todos los participantes</option>
            <option value="SIN_MENTOR">Sin mentor</option>
            @for (mentor of mentores(); track mentor.id) {<option [value]="mentor.id.toString()">{{ mentor.nombreCompleto }}</option>}
          </select>
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
                <tr><td colspan="4" class="state">No hay participantes para este filtro.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [`
    :host{display:block}.assignment-panel{margin:0 0 18px;padding:20px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px}.assignment-panel>header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}.assignment-panel header span{color:#60a5fa;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.assignment-panel h2{margin:4px 0 0;font-size:20px}.summary{padding:10px 14px;background:rgba(245,158,11,.12);border-radius:10px;color:var(--text-secondary);font-size:13px}.summary strong{color:#f59e0b;font-size:19px}.filter-row{display:flex;align-items:end;gap:12px;margin-bottom:14px}.filter-row label{display:grid;gap:6px;color:var(--text-secondary);font-size:12px;font-weight:700}.filter-row select,td select{min-width:220px;padding:9px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary)}.table-wrap{overflow-x:auto;border:1px solid var(--border-color);border-radius:10px}table{width:100%;border-collapse:collapse}th,td{padding:12px 14px;text-align:left;border-bottom:1px solid var(--border-color)}th{color:var(--text-muted);font-size:11px;text-transform:uppercase}td{color:var(--text-primary);font-size:13px}td small{display:block;margin-top:5px;color:#60a5fa}.mentor-badge{display:inline-block;padding:5px 9px;border-radius:999px;background:rgba(16,185,129,.12);color:#34d399;font-size:12px;font-weight:700}.mentor-badge.unassigned{background:rgba(245,158,11,.12);color:#fbbf24}.state{padding:22px;text-align:center;color:var(--text-muted)}.error{padding:12px;background:rgba(239,68,68,.1);border-radius:8px;color:#f87171}.error button{border:0;background:none;color:inherit;font-weight:800;text-decoration:underline;cursor:pointer}@media(max-width:650px){.assignment-panel>header{align-items:start}.summary{display:none}.filter-row,.filter-row label,.filter-row select{width:100%}th:nth-child(2),td:nth-child(2){display:none}th,td{padding:10px}td select{min-width:170px;max-width:190px}}
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
  readonly guardando = signal<ReadonlySet<number>>(new Set());
  readonly sinMentor = computed(() => this.asignaciones().filter(item => !item.mentor).length);
  readonly asignacionesFiltradas = computed(() => {
    const filtro = this.filtro();
    if (filtro === 'SIN_MENTOR') return this.asignaciones().filter(item => !item.mentor);
    if (filtro === 'TODOS') return this.asignaciones();
    const mentorId = Number(filtro);
    return this.asignaciones().filter(item => item.mentor?.id === mentorId);
  });

  constructor() {
    effect(onCleanup => {
      const cicloId = this.cicloId();
      this.filtro.set('TODOS');
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
