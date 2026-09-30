import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { EncuentroAsistencia, EncuentroCiclo, EncuentroDashboard, EncuentroParticipante } from '../../../core/models/encuentro-poder.model';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';

@Component({
  selector: 'app-encuentro-dashboard', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  template: `<div class="page">
    <header class="heading">
      <div><span class="eyebrow">Módulo operativo</span><h1>Encuentro de Poder</h1></div>
      <a routerLink="/encuentro-poder/ciclos/nuevo" class="button secondary">Nuevo ciclo</a>
    </header>

    <section class="toolbar">
      <label>Ciclo
        <select [value]="cicloSeleccionado() ?? ''" (change)="seleccionarCiclo($event)" [disabled]="cargandoCiclos()">
          <option value="">{{ cargandoCiclos() ? 'Cargando ciclos...' : 'Selecciona un ciclo' }}</option>
          @for (ciclo of ciclos(); track ciclo.id) {<option [value]="ciclo.id">{{ ciclo.nombre }} · {{ ciclo.estado }}</option>}
        </select>
      </label>
      @if (dashboard()) {
        <button class="button" (click)="exportar()" [disabled]="exportando()">{{ exportando() ? 'Exportando...' : 'Exportar Excel' }}</button>
        <button class="button secondary" (click)="archivoInput.click()" [disabled]="importando()">{{ importando() ? 'Importando...' : 'Importar Excel' }}</button>
        <input #archivoInput type="file" accept=".xlsx" hidden (change)="importar($event)">
        <button class="button secondary" (click)="copiarEnlace()">Copiar enlace de inscripción</button>
      }
    </section>

    @if (enlaceCopiado()) {<p class="notice">Enlace copiado al portapapeles.</p>}
    @if (mensajeImportacion()) {<p class="notice">{{ mensajeImportacion() }}</p>}
    @if (errorImportacion()) {<p class="error">{{ errorImportacion() }}</p>}
    @if (errorAsistencia()) {<p class="error">{{ errorAsistencia() }}</p>}
    @if (errorAccion()) {<p class="error">{{ errorAccion() }}</p>}
    @if (errorCiclos()) {<p class="error">{{ errorCiclos() }}</p>}
    @if (errorDashboard(); as error) {<p class="error">{{ error }} <button class="link" (click)="cargar()">Reintentar</button></p>}
    @if (cargando()) {<div class="notice">{{ dashboard() ? 'Actualizando los datos del ciclo...' : 'Cargando los datos del ciclo...' }}</div>}

    @if (dashboard(); as data) {
      <section class="stats">
        <article><b>{{ data.inscritos }}</b><span>Inscritos</span></article>
        <article><b>{{ data.conAsistencia }}</b><span>Con asistencia</span></article>
        <article class="highlight"><b>{{ data.graduados.length }}</b><span>Graduados</span></article>
        <article><b>{{ data.pendientes }}</b><span>Pendientes</span></article>
      </section>

      <section class="grid">
        <article class="panel">
          <h2>Asistencia por día</h2>
          @for (clase of data.clases; track clase.claseId) {
            <div class="class-row">
              <span>{{ clase.nombre }}<small>{{ clase.fecha | date:'dd/MM/yyyy' }}</small></span>
              <strong>{{ clase.presentes }} / {{ clase.inscritos }} ({{ porcentaje(clase.presentes, clase.inscritos) }}%)</strong>
              @if (esClaseObligatoria(data.ciclo.clases, clase.claseId)) {
                <button class="link" (click)="generarQr(data.ciclo.clases, clase.claseId)" [disabled]="generandoQr() === clase.claseId">{{ generandoQr() === clase.claseId ? 'Generando...' : 'Generar QR' }}</button>
              }
              <div class="bar"><i [style.width.%]="porcentaje(clase.presentes, clase.inscritos)"></i></div>
            </div>
          }
        </article>

        <article class="panel">
          <h2>Tomar asistencia</h2>
          <label>Clase
            <select [ngModel]="claseSeleccionada()" (ngModelChange)="seleccionarClase($event)">
              <option [ngValue]="null">Selecciona una clase</option>
              @for (clase of data.ciclo.clases; track clase.id) { @if (clase.obligatoria) {<option [ngValue]="clase.id">{{ clase.nombre }}</option>} }
            </select>
          </label>
          <input class="search" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)" placeholder="Buscar por nombre o teléfono">
          <div class="attendees">
            @for (participante of participantesFiltrados(); track participante.persona.id) {
              <div class="attendee">
                <div><strong>{{ participante.persona.nombreCompleto }}</strong><small>{{ participante.persona.telefono }}</small></div>
                @if (presentesClase().has(participante.persona.id)) {<span class="present">Presente</span>}
                @else {<button class="mark" [disabled]="!claseSeleccionada() || estaMarcando(participante.persona.id)" (click)="marcar(participante)">{{ estaMarcando(participante.persona.id) ? '...' : 'Marcar' }}</button>}
              </div>
            }
          </div>
        </article>
      </section>

      <section class="panel">
        <h2>Graduados del ciclo ({{ data.graduados.length }})</h2>
        @if (data.graduados.length) {
          <div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Teléfono</th><th>Clases completadas</th><th>Comuna</th><th></th></tr></thead><tbody>
            @for (participante of data.graduados; track participante.persona.id) {<tr><td>{{ participante.persona.nombreCompleto }}</td><td>{{ participante.persona.telefono }}</td><td>{{ participante.clasesCompletadas }} / 3</td><td>{{ participante.persona.comuna || '—' }}</td><td><button class="link" (click)="verHistorial(participante)">Historial</button></td></tr>}
          </tbody></table></div>
        } @else {<p class="muted">Todavía no hay personas graduadas en este ciclo.</p>}
      </section>

      <section class="panel">
        <h2>Estado de graduación</h2>
        <div class="table-wrap"><table><thead><tr><th>Persona</th><th>Teléfono</th><th>Clases completadas</th><th>Faltantes</th><th>Estado</th><th></th></tr></thead><tbody>
          @for (participante of participantesPagina(); track participante.persona.id) {<tr><td>{{ participante.persona.nombreCompleto }}</td><td>{{ participante.persona.telefono }}</td><td>{{ participante.clasesCompletadas }} / 3</td><td>{{ participante.clasesFaltantes.join(', ') || '—' }}</td><td><span [class.complete]="participante.estado === 'COMPLETO'" class="status">{{ participante.estado }}</span></td><td><button class="link" (click)="verHistorial(participante)">Historial</button></td></tr>}
        </tbody></table></div>
        @if (totalPaginas() > 1) {<div><button class="button secondary" [disabled]="paginaEstado() === 0" (click)="cambiarPagina(-1)">Anterior</button> Página {{ paginaEstado() + 1 }} de {{ totalPaginas() }} <button class="button secondary" [disabled]="paginaEstado() + 1 >= totalPaginas()" (click)="cambiarPagina(1)">Siguiente</button></div>}
      </section>

      @if (historial(); as detalle) {<div class="modal-backdrop" (click)="cerrarHistorial()"><article class="modal" (click)="$event.stopPropagation()"><button class="close" (click)="cerrarHistorial()">×</button><h2>{{ detalle.persona.nombreCompleto }}</h2><p>{{ detalle.persona.telefono }} · {{ detalle.persona.comuna || 'Sin comuna' }}</p><h3>{{ detalle.estado }}</h3>@for (asistencia of detalle.asistencias; track asistencia.id) {<div class="history-row"><span>{{ asistencia.clase }}</span><span>{{ asistencia.fechaHora | date:'dd/MM/yyyy HH:mm' }}</span></div>} @if (!detalle.asistencias.length) {<p>No registra asistencias.</p>}</article></div>}
      @if (qr(); as codigo) {<div class="modal-backdrop" (click)="cerrarQr()"><article class="modal qr-modal" (click)="$event.stopPropagation()"><button class="close" (click)="cerrarQr()">×</button><h2>QR {{ codigo.nombre }}</h2><p>{{ codigo.fecha | date:'dd/MM/yyyy' }}</p><img [src]="codigo.imagen" [alt]="'QR para ' + codigo.nombre"><button class="button" (click)="descargarQr()">Descargar QR</button><small>{{ codigo.url }}</small></article></div>}
    } @else if (!cargando() && !errorDashboard()) {<div class="empty">Selecciona un ciclo para comenzar.</div>}
  </div>`,
  styles: [`:host{display:block;color:var(--text-primary)}.page{max-width:1280px;margin:0 auto;padding:28px 22px}.heading,.toolbar,.stats,.grid{display:flex;gap:16px}.heading{justify-content:space-between;align-items:center;margin-bottom:22px}.eyebrow{color:#7da9ff;font-weight:700}h1{font-size:34px;margin:6px 0 0}h2{margin-top:0;font-size:18px}.toolbar{align-items:end;flex-wrap:wrap;padding:16px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px}.toolbar label,.panel label{display:grid;gap:6px;font-size:13px;font-weight:600}select,.search{min-width:240px;padding:10px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary)}.button,.mark{border:0;border-radius:8px;background:#3978ee;color:white;padding:10px 14px;font-weight:700;text-decoration:none;cursor:pointer}.secondary{background:transparent;border:1px solid var(--border-color);color:var(--text-primary)}.notice,.empty{padding:14px;background:rgba(59,130,246,.12);border-radius:10px;margin:16px 0}.stats{margin:20px 0}.stats article{flex:1;padding:18px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px}.stats b{display:block;font-size:28px}.stats span{color:var(--text-secondary);font-size:13px}.grid{align-items:start}.panel{flex:1;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:20px;margin-bottom:18px}.class-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin:16px 0}.bar{grid-column:1/-1;height:7px;background:var(--bg-secondary);border-radius:9px;overflow:hidden}.bar i{display:block;height:100%;background:#4f8cff}.search{width:100%;box-sizing:border-box;margin:14px 0}.attendees{max-height:420px;overflow:auto}.attendee{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--border-color)}small{display:block;color:var(--text-secondary);margin-top:3px}.present{color:#4ade80;font-weight:700}.mark{padding:7px 10px}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--border-color);white-space:nowrap}.status{color:#fbbf24}.status.complete{color:#4ade80}.link{border:0;background:none;color:#75a6ff;cursor:pointer}.modal-backdrop{position:fixed;inset:0;background:#0008;display:grid;place-items:center;padding:20px}.modal{position:relative;background:var(--bg-card);border:1px solid var(--border-color);border-radius:14px;padding:26px;min-width:min(500px,100%)}.close{position:absolute;right:12px;top:8px;background:none;border:0;color:var(--text-primary);font-size:26px}.history-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-color)}.muted{color:var(--text-secondary)}@media(max-width:800px){.grid,.stats{display:grid;grid-template-columns:1fr}.heading{align-items:start}.stats article{display:flex;justify-content:space-between;align-items:center}}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncuentroDashboardComponent implements OnInit {
  private readonly service = inject(EncuentroPoderService);
  private readonly destroyRef = inject(DestroyRef);
  private dashboardRequest?: Subscription;
  private historyRequest?: Subscription;
  private dashboardSequence = 0;
  private dataRevision = 0;
  private qrSequence = 0;
  private copyTimer?: ReturnType<typeof setTimeout>;
  private readonly pageSize = 25;

  readonly ciclos = signal<EncuentroCiclo[]>([]);
  readonly cicloSeleccionado = signal<number | null>(null);
  readonly claseSeleccionada = signal<number | null>(null);
  readonly dashboard = signal<EncuentroDashboard | null>(null);
  readonly historial = signal<EncuentroParticipante | null>(null);
  readonly busqueda = signal('');
  readonly cargandoCiclos = signal(true);
  readonly cargando = signal(false);
  readonly marcando = signal<ReadonlySet<string>>(new Set());
  readonly enlaceCopiado = signal(false);
  readonly importando = signal(false);
  readonly exportando = signal(false);
  readonly generandoQr = signal<number | null>(null);
  readonly mensajeImportacion = signal('');
  readonly errorImportacion = signal('');
  readonly errorAsistencia = signal('');
  readonly errorAccion = signal('');
  readonly errorCiclos = signal('');
  readonly errorDashboard = signal('');
  readonly paginaEstado = signal(0);
  readonly qr = signal<{ nombre: string; fecha: string; url: string; imagen: string } | null>(null);

  readonly participantesFiltrados = computed(() => {
    const participantes = this.dashboard()?.participantes ?? [];
    const termino = this.busqueda().trim().toLocaleLowerCase('es');
    if (!termino) return participantes;
    return participantes.filter(participante =>
      `${participante.persona.nombreCompleto} ${participante.persona.telefono}`.toLocaleLowerCase('es').includes(termino)
    );
  });
  readonly presentesClase = computed(() => {
    const claseId = this.claseSeleccionada();
    if (!claseId) return new Set<number>();
    return new Set((this.dashboard()?.participantes ?? [])
      .filter(participante => participante.asistencias.some(asistencia => asistencia.claseId === claseId))
      .map(participante => participante.persona.id));
  });
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil((this.dashboard()?.participantes.length ?? 0) / this.pageSize)));
  readonly participantesPagina = computed(() => {
    const inicio = this.paginaEstado() * this.pageSize;
    return (this.dashboard()?.participantes ?? []).slice(inicio, inicio + this.pageSize);
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.copyTimer && clearTimeout(this.copyTimer));
    this.service.ciclos().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoCiclos.set(false)),
    ).subscribe({
      next: ciclos => this.ciclos.set(ciclos),
      error: error => this.errorCiclos.set(this.mensajeError(error, 'No fue posible cargar los ciclos.')),
    });
  }

  seleccionarCiclo(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const cicloId = value ? Number(value) : null;
    if (cicloId === this.cicloSeleccionado()) return;
    this.cicloSeleccionado.set(cicloId);
    this.claseSeleccionada.set(null);
    this.busqueda.set('');
    this.paginaEstado.set(0);
    this.historyRequest?.unsubscribe();
    this.historial.set(null);
    this.qrSequence++;
    this.generandoQr.set(null);
    this.qr.set(null);
    this.errorAccion.set('');
    this.cargar();
  }

  seleccionarClase(claseId: number | null): void {
    this.claseSeleccionada.set(claseId);
    this.errorAsistencia.set('');
  }

  cargar(): void {
    const cicloId = this.cicloSeleccionado();
    const sequence = ++this.dashboardSequence;
    const revision = this.dataRevision;
    this.dashboardRequest?.unsubscribe();
    this.errorDashboard.set('');
    if (!cicloId) {
      this.dashboard.set(null);
      this.cargando.set(false);
      return;
    }
    if (this.dashboard()?.ciclo.id !== cicloId) this.dashboard.set(null);
    this.cargando.set(true);
    this.dashboardRequest = this.service.dashboard(cicloId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { if (sequence === this.dashboardSequence) this.cargando.set(false); }),
    ).subscribe({
      next: data => {
        if (sequence !== this.dashboardSequence || revision !== this.dataRevision) return;
        const claseActual = this.claseSeleccionada();
        const conservaClase = data.ciclo.clases.some(clase => clase.id === claseActual && clase.obligatoria);
        this.dashboard.set(data);
        this.claseSeleccionada.set(conservaClase ? claseActual : data.ciclo.clases.find(clase => clase.obligatoria)?.id ?? null);
        this.paginaEstado.set(Math.min(this.paginaEstado(), Math.max(0, Math.ceil(data.participantes.length / this.pageSize) - 1)));
      },
      error: error => {
        if (sequence === this.dashboardSequence) this.errorDashboard.set(this.mensajeError(error, 'No fue posible cargar los datos del ciclo.'));
      },
    });
  }

  porcentaje(presentes: number, inscritos: number): number {
    return inscritos ? Math.round(presentes / inscritos * 100) : 0;
  }

  esClaseObligatoria(clases: EncuentroCiclo['clases'], claseId: number): boolean {
    return clases.some(clase => clase.id === claseId && clase.obligatoria);
  }

  estaMarcando(personaId: number): boolean {
    const claseId = this.claseSeleccionada();
    return !!claseId && this.marcando().has(`${claseId}:${personaId}`);
  }

  marcar(participante: EncuentroParticipante): void {
    const data = this.dashboard();
    const claseId = this.claseSeleccionada();
    if (!data || !claseId) return;
    const cicloId = data.ciclo.id;
    const key = `${claseId}:${participante.persona.id}`;
    if (this.marcando().has(key)) return;
    this.marcando.update(actual => new Set(actual).add(key));
    this.errorAsistencia.set('');
    this.service.registrarAsistencia(participante.persona.id, claseId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.marcando.update(actual => {
        const siguiente = new Set(actual);
        siguiente.delete(key);
        return siguiente;
      })),
    ).subscribe({
      next: asistencia => {
        if (this.dashboard()?.ciclo.id === cicloId) {
          this.dataRevision++;
          this.aplicarAsistencia(asistencia);
        }
      },
      error: error => this.errorAsistencia.set(this.mensajeError(error, `No fue posible registrar la asistencia de ${participante.persona.nombreCompleto}.`)),
    });
  }

  verHistorial(participante: EncuentroParticipante): void {
    this.historyRequest?.unsubscribe();
    this.errorAccion.set('');
    this.historyRequest = this.service.historial(participante.persona.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: historial => this.historial.set(historial),
      error: error => this.errorAccion.set(this.mensajeError(error, 'No fue posible cargar el historial.')),
    });
  }

  cerrarHistorial(): void { this.historyRequest?.unsubscribe(); this.historial.set(null); }

  async generarQr(clases: EncuentroCiclo['clases'], claseId: number): Promise<void> {
    const clase = clases.find(item => item.id === claseId);
    if (!clase?.obligatoria) return;
    if (!clase.publicToken) {
      this.errorAccion.set('Esta clase no tiene token QR. Ejecuta la migración 007_encuentro_poder_qr.sql en la base de datos.');
      return;
    }
    const sequence = ++this.qrSequence;
    const cicloId = this.dashboard()?.ciclo.id;
    const url = `${window.location.origin}/asistencia-encuentro/${clase.publicToken}`;
    this.generandoQr.set(claseId);
    this.errorAccion.set('');
    try {
      const { default: QRCode } = await import('qrcode');
      const imagen = await QRCode.toDataURL(url, { width: 360, margin: 2 });
      if (sequence === this.qrSequence && this.dashboard()?.ciclo.id === cicloId) this.qr.set({ nombre: clase.nombre, fecha: clase.fecha, url, imagen });
    } catch {
      if (sequence === this.qrSequence) this.errorAccion.set('No fue posible generar el código QR.');
    } finally {
      if (sequence === this.qrSequence) this.generandoQr.set(null);
    }
  }

  cerrarQr(): void { this.qr.set(null); }

  descargarQr(): void {
    const codigo = this.qr();
    if (!codigo) return;
    const anchor = document.createElement('a');
    anchor.href = codigo.imagen;
    anchor.download = `qr-${codigo.nombre.toLowerCase().replaceAll(' ', '-')}.png`;
    anchor.click();
  }

  exportar(): void {
    const cicloId = this.cicloSeleccionado();
    if (!cicloId || this.exportando()) return;
    this.exportando.set(true);
    this.errorAccion.set('');
    this.service.exportar(cicloId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.exportando.set(false)),
    ).subscribe({
      next: blob => this.descargar(blob, `encuentro_poder_${cicloId}.xlsx`),
      error: error => this.errorAccion.set(this.mensajeError(error, 'No fue posible exportar el ciclo.')),
    });
  }

  async copiarEnlace(): Promise<void> {
    const ciclo = this.ciclos().find(item => item.id === this.cicloSeleccionado());
    if (!ciclo) return;
    this.errorAccion.set('');
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/inscripcion-encuentro/${ciclo.publicToken}`);
      this.enlaceCopiado.set(true);
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.enlaceCopiado.set(false), 2200);
    } catch {
      this.errorAccion.set('No fue posible copiar el enlace al portapapeles.');
    }
  }

  importar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    const cicloId = this.cicloSeleccionado();
    if (!archivo || !cicloId || this.importando()) return;
    this.importando.set(true);
    this.mensajeImportacion.set('');
    this.errorImportacion.set('');
    this.service.importar(cicloId, archivo).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.importando.set(false); input.value = ''; }),
    ).subscribe({
      next: resultado => {
        if (this.cicloSeleccionado() !== cicloId) return;
        this.dataRevision++;
        this.mensajeImportacion.set(`Importadas ${resultado.inscripcionesImportadas} inscripciones y ${resultado.asistenciasImportadas} asistencias. Sin teléfono: ${resultado.filasSinTelefono}; sin coincidencia: ${resultado.asistenciasSinCoincidencia}; ambiguas: ${resultado.asistenciasAmbiguas}.`);
        this.cargar();
      },
      error: error => this.errorImportacion.set(this.mensajeError(error, 'No fue posible importar el archivo Excel.')),
    });
  }

  cambiarPagina(delta: number): void {
    this.paginaEstado.update(actual => Math.min(Math.max(actual + delta, 0), this.totalPaginas() - 1));
  }

  private aplicarAsistencia(asistencia: EncuentroAsistencia): void {
    const data = this.dashboard();
    if (!data) return;
    const actual = data.participantes.find(participante => participante.persona.id === asistencia.personaId);
    if (!actual || actual.asistencias.some(item => item.claseId === asistencia.claseId)) return;
    const obligatorias = data.ciclo.clases.filter(clase => clase.obligatoria).sort((a, b) => a.orden - b.orden);
    const participantes = data.participantes.map(participante => {
      if (participante.persona.id !== asistencia.personaId) return participante;
      const asistencias = [...participante.asistencias, asistencia];
      const presentes = new Set(asistencias.map(item => item.claseId));
      const faltantes = obligatorias.filter(clase => !presentes.has(clase.id)).map(clase => clase.nombre);
      return { ...participante, asistencias, clasesCompletadas: obligatorias.length - faltantes.length, clasesFaltantes: faltantes, estado: faltantes.length ? 'PENDIENTE' as const : 'COMPLETO' as const };
    });
    const graduados = participantes.filter(participante => participante.estado === 'COMPLETO');
    this.dashboard.set({
      ...data,
      conAsistencia: participantes.filter(participante => participante.asistencias.length > 0).length,
      completos: graduados.length,
      pendientes: participantes.length - graduados.length,
      clases: data.clases.map(clase => clase.claseId === asistencia.claseId ? { ...clase, presentes: clase.presentes + 1 } : clase),
      participantes,
      graduados,
    });
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = nombre;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (error.status === 504) return 'La red o el servidor tardaron demasiado en responder. Inténtalo nuevamente.';
    const message = error.error && typeof error.error === 'object' && typeof error.error.message === 'string' ? error.error.message : null;
    return message || fallback;
  }
}
