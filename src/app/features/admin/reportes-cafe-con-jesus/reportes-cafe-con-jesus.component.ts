import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import {
  ReporteCafeEstado, ReporteCafeFiltros, ReporteCafeOpcion, ReporteCafeRegistro,
  ReporteCafeConsulta, ReporteCafeOpciones, ReporteCafePagina,
} from '../../../core/models/reporte-cafe-con-jesus.model';
import { ReporteCafeConJesusService } from '../../../core/services/reporte-cafe-con-jesus.service';

type Booleano = '' | 'true' | 'false';
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const TAMANOS = Object.freeze([10, 25, 50, 100] as const);
const ETAPAS = Object.freeze([
  ['PRIMERA_INVITACION', 'Primera invitación'], ['SEGUNDA_INVITACION', 'Segunda invitación'],
  ['TERCERA_INVITACION', 'Tercera invitación'], ['ASISTIO_OTRA_VEZ', 'Asistió otra vez a la cate'],
  ['MENSAJE_FINAL', 'Mensaje final'],
]);
const ESTADOS: Readonly<Record<ReporteCafeEstado, string>> = {
  ACTIVO: 'Activo', CONVERTIDO: 'Convertido', ARCHIVADO: 'Archivado',
};

function isoTimestamp(value: string): number | null {
  if (!FECHA.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const time = Date.UTC(y, m - 1, d); const date = new Date(time);
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? time : null;
}
function fechaLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function crearFiltrosCafePredeterminados(ahora = new Date()): Readonly<ReporteCafeFiltros> {
  return Object.freeze({ desde: fechaLocal(new Date(ahora.getFullYear(), ahora.getMonth(), 1)), hasta: fechaLocal(ahora) });
}
export function validarRangoCafe(desde: string, hasta: string): string | null {
  const inicio = isoTimestamp(desde); const fin = isoTimestamp(hasta);
  if (inicio === null || fin === null) return 'Ingresa fechas válidas en formato YYYY-MM-DD.';
  return inicio > fin ? 'La fecha desde no puede ser posterior a la fecha hasta.' : null;
}
export function crearNombreArchivoCafe(date: Date): string { return `reporte-cafe-con-jesus-${fechaLocal(date)}.xlsx`; }
function nombreSeguro(value: string, fallback: string): string {
  const last = value.split(/[\\/]/).at(-1)?.trim().replace(/[\u0000-\u001f\u007f]/g, '') ?? '';
  return last || fallback;
}
export function extraerNombreArchivoCafe(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const encoded = /filename\*\s*=\s*(?:"([^"]+)"|([^;]+))/i.exec(header);
  const raw = encoded?.[1] ?? encoded?.[2];
  if (raw !== undefined) {
    const value = raw.trim().replace(/^"|"$/g, ''); const match = /^[^']*'[^']*'(.*)$/.exec(value);
    try { return nombreSeguro(decodeURIComponent(match?.[1] ?? value), fallback); } catch { return nombreSeguro(match?.[1] ?? value, fallback); }
  }
  const standard = /filename\s*=\s*(?:"([^"]*)"|([^;]*))/i.exec(header);
  return standard ? nombreSeguro(standard[1] ?? standard[2], fallback) : fallback;
}
function bool(value: Booleano): boolean | undefined { return value === '' ? undefined : value === 'true'; }
function num(value: string): number | undefined { return value === '' || !Number.isInteger(Number(value)) ? undefined : Number(value); }
function errorMessage(error: unknown): string {
  const payload = error instanceof HttpErrorResponse ? error.error : null;
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') return payload.message;
  return 'No fue posible cargar el reporte de Café con Jesús.';
}

@Component({
  selector: 'app-reportes-cafe-con-jesus', standalone: true, imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reportes-cafe-con-jesus.component.html', styleUrl: './reportes-cafe-con-jesus.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesCafeConJesusComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder); private readonly service = inject(ReporteCafeConJesusService);
  private readonly destroyRef = inject(DestroyRef); private readonly document = inject(DOCUMENT);
  private readonly initial = crearFiltrosCafePredeterminados(); private request?: Subscription; private requestedPage = 0; private requestSequence = 0;
  private readonly filters = signal(this.initial); private readonly pageState = signal<ReporteCafePagina | null>(null);
  private readonly loadingState = signal(false); private readonly errorState = signal<string | null>(null);
  private readonly optionsState = signal<ReporteCafeOpciones>({ reuniones: [], usuarios: [] });
  private readonly optionsErrorState = signal<string | null>(null); private readonly downloadState = signal(false);
  private readonly downloadErrorState = signal<string | null>(null); private readonly validationState = signal<string | null>(null);
  readonly expanded = signal(false); readonly pageSize = signal(25); readonly sizes = TAMANOS; readonly etapas = ETAPAS;
  readonly form = this.fb.group({ desde: this.initial.desde, hasta: this.initial.hasta, reunionId: '', estado: '' as '' | ReporteCafeEstado,
    etapa: '', usuarioAsignadoId: '', registradoPorId: '', sinAsignar: '' as Booleano, asistio: '' as Booleano,
    aceptoAlSenor: '' as Booleano, convertidoAConsolidado: '' as Booleano, archivado: '' as Booleano, texto: '' });
  readonly filtros = this.filters.asReadonly(); readonly resultado = this.pageState.asReadonly(); readonly cargando = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly(); readonly opciones = this.optionsState.asReadonly(); readonly errorOpciones = this.optionsErrorState.asReadonly();
  readonly descargando = this.downloadState.asReadonly(); readonly errorDescarga = this.downloadErrorState.asReadonly(); readonly errorValidacion = this.validationState.asReadonly();
  readonly filas = computed(() => this.pageState()?.content ?? []); readonly total = computed(() => this.pageState()?.totalElements ?? 0);
  readonly firstVisible = computed(() => this.total() ? (this.pageState()?.page ?? 0) * this.pageSize() + 1 : 0);
  readonly lastVisible = computed(() => Math.min(((this.pageState()?.page ?? 0) + 1) * this.pageSize(), this.total()));

  ngOnInit(): void { this.cargarOpciones(); this.cargar(0, this.pageSize()); }
  aplicar(): void {
    const raw = this.form.getRawValue(); const validation = validarRangoCafe(raw.desde, raw.hasta);
    this.validationState.set(validation); if (validation) return;
    this.downloadErrorState.set(null); this.filters.set(this.snapshot(raw)); this.cargar(0, this.pageSize());
  }
  limpiar(): void { this.form.reset({ ...this.initial, reunionId: '', estado: '', etapa: '', usuarioAsignadoId: '', registradoPorId: '', sinAsignar: '', asistio: '', aceptoAlSenor: '', convertidoAConsolidado: '', archivado: '', texto: '' }); this.pageSize.set(25); this.filters.set(this.initial); this.validationState.set(null); this.cargar(0, 25); }
  toggleAdvanced(): void { this.expanded.update(value => !value); }
  cambiarTamano(value: string): void { const size = Number(value); if ((TAMANOS as readonly number[]).includes(size)) { this.pageSize.set(size); this.cargar(0, size); } }
  cambiarTamanoDesdeEvento(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) this.cambiarTamano(target.value);
  }
  irAPagina(page: number): void { const result = this.pageState(); if (result && page >= 0 && page < result.totalPages && page !== result.page && !this.cargando()) this.cargar(page, this.pageSize()); }
  reintentar(): void { this.cargar(this.requestedPage, this.pageSize()); }
  exportar(): void {
    if (!this.total() || this.descargando()) return; this.downloadState.set(true); this.downloadErrorState.set(null);
    this.service.exportar(this.filters()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.downloadState.set(false))).subscribe({
      next: response => { if (!response.body) { this.downloadErrorState.set('El archivo generado está vacío.'); return; } const name = extraerNombreArchivoCafe(response.headers.get('Content-Disposition'), crearNombreArchivoCafe(new Date())); try { this.save(response.body, name); } catch { this.downloadErrorState.set('No fue posible guardar el archivo.'); } },
      error: error => this.downloadErrorState.set(errorMessage(error)),
    });
  }
  nombre(registro: ReporteCafeRegistro): string { return registro.nombreCompleto?.trim() || [registro.nombre, registro.apellido].filter(Boolean).join(' ') || 'Sin nombre'; }
  etiquetaOpcion(option: ReporteCafeOpcion): string { return option.nombreCompleto?.trim() || option.nombre?.trim() || option.username?.trim() || `#${option.id}`; }
  etiquetaEtapa(value: string | null): string { return ETAPAS.find(([key]) => key === value)?.[1] ?? value ?? 'Sin etapa'; }
  etiquetaEstado(value: ReporteCafeRegistro): string { return value.estadoDescripcion?.trim() || (value.estado ? ESTADOS[value.estado] : 'Sin estado'); }
  claseEstado(value: ReporteCafeEstado | null): string { return value ? `estado-${value.toLowerCase()}` : 'estado-none'; }
  booleano(value: boolean | null): string { return value === null ? 'Sin registro' : value ? 'Sí' : 'No'; }
  telefonoHref(value: string): string { return `tel:${value.replace(/[^\d+]/g, '')}`; }

  private snapshot(raw: ReturnType<typeof this.form.getRawValue>): Readonly<ReporteCafeFiltros> {
    const optional: ReporteCafeFiltros = { desde: raw.desde, hasta: raw.hasta };
    const values = { reunionId: num(raw.reunionId), estado: raw.estado || undefined, etapa: raw.etapa || undefined, usuarioAsignadoId: num(raw.usuarioAsignadoId), registradoPorId: num(raw.registradoPorId), sinAsignar: bool(raw.sinAsignar), asistio: bool(raw.asistio), aceptoAlSenor: bool(raw.aceptoAlSenor), convertidoAConsolidado: bool(raw.convertidoAConsolidado), archivado: bool(raw.archivado), texto: raw.texto.trim() || undefined };
    return Object.freeze({ ...optional, ...values });
  }
  cargarOpciones(): void { this.optionsErrorState.set(null); this.service.obtenerOpciones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: value => this.optionsState.set(value), error: error => this.optionsErrorState.set(errorMessage(error)) }); }
  private cargar(page: number, size: number): void {
    const sequence = ++this.requestSequence;
    this.request?.unsubscribe(); this.requestedPage = page; this.loadingState.set(true); this.errorState.set(null); this.pageState.set(null);
    const query: ReporteCafeConsulta = { ...this.filters(), page, size };
    this.request = this.service.consultar(query).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { if (sequence === this.requestSequence) this.loadingState.set(false); })).subscribe({ next: value => { if (sequence === this.requestSequence) this.pageState.set({ ...value, content: [...value.content] }); }, error: error => { if (sequence === this.requestSequence) this.errorState.set(errorMessage(error)); } });
  }
  private save(blob: Blob, name: string): void { const urlApi = this.document.defaultView?.URL; if (!urlApi) throw new Error('URL no disponible'); const url = urlApi.createObjectURL(blob); const link = this.document.createElement('a'); link.href = url; link.download = name; link.hidden = true; this.document.body.append(link); try { link.click(); } finally { link.remove(); urlApi.revokeObjectURL(url); } }
}
