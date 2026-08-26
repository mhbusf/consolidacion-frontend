import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import {
  ReporteConsolidado,
  ReporteConsolidadoAlcance,
  ReporteConsolidadoComunaOpcion,
  ReporteConsolidadoConsulta,
  ReporteConsolidadoEstado,
  ReporteConsolidadoFiltros,
  ReporteConsolidadoOpciones,
  ReporteConsolidadoPagina,
  ReporteConsolidadoReunionOpcion,
  ReporteConsolidadoUsuarioOpcion,
} from '../../../core/models/reporte-consolidado.model';
import { ReporteConsolidadoService } from '../../../core/services/reporte-consolidado.service';

type FiltroBooleano = '' | 'true' | 'false';

export interface ReporteConsolidadoFormulario {
  readonly desde: string;
  readonly hasta: string;
  readonly reunionId: string;
  readonly alcance: ReporteConsolidadoAlcance;
  readonly estado: '' | ReporteConsolidadoEstado;
  readonly usuarioAsignadoId: string;
  readonly sinAsignar: FiltroBooleano;
  readonly usuarioReportaId: string;
  readonly comunaId: string;
  readonly origenCafeConJesus: FiltroBooleano;
  readonly hitoTresSemanasCumplido: FiltroBooleano;
  readonly conGdc: FiltroBooleano;
  readonly texto: string;
}

const PATRON_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const TAMANOS_PAGINA = Object.freeze([10, 25, 50, 100] as const);
const TAMANO_PAGINA_PREDETERMINADO = 25;
const FILAS_VACIAS: readonly ReporteConsolidado[] = Object.freeze([]);
const OPCIONES_VACIAS: ReporteConsolidadoOpciones = Object.freeze({
  reuniones: Object.freeze([]),
  comunas: Object.freeze([]),
  usuarios: Object.freeze([]),
});

const ETIQUETAS_ESTADO: Readonly<Record<ReporteConsolidadoEstado, string>> = Object.freeze({
  PENDIENTE: 'Pendiente',
  ASIGNADO: 'Asignado',
  EN_PROCESO: 'En proceso',
  GDC: 'Con GDC',
  CERRADO: 'Cerrado',
});

export function formatearFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function crearFiltrosPredeterminados(
  ahora: Date = new Date(),
): Readonly<ReporteConsolidadoFiltros> {
  const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  return Object.freeze({
    desde: formatearFechaLocal(primerDia),
    hasta: formatearFechaLocal(ahora),
    alcance: 'TODOS',
  });
}

function fechaIsoATimestamp(valor: string): number | null {
  const coincidencia = PATRON_FECHA_ISO.exec(valor);
  if (coincidencia === null) {
    return null;
  }

  const [anioTexto, mesTexto, diaTexto] = valor.split('-');
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);
  const timestamp = Date.UTC(anio, mes - 1, dia);
  const fecha = new Date(timestamp);

  if (
    fecha.getUTCFullYear() !== anio
    || fecha.getUTCMonth() !== mes - 1
    || fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  return timestamp;
}

export function validarRangoFechas(desde: string, hasta: string): string | null {
  const inicio = fechaIsoATimestamp(desde);
  const fin = fechaIsoATimestamp(hasta);

  if (inicio === null || fin === null) {
    return 'Ingresa las fechas desde y hasta en formato válido.';
  }
  if (inicio > fin) {
    return 'La fecha desde no puede ser posterior a la fecha hasta.';
  }

  return null;
}

function numeroOpcional(valor: string): number | undefined {
  if (valor === '') {
    return undefined;
  }

  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : undefined;
}

function booleanoOpcional(valor: FiltroBooleano): boolean | undefined {
  if (valor === '') {
    return undefined;
  }
  return valor === 'true';
}

export function crearSnapshotFiltros(
  formulario: ReporteConsolidadoFormulario,
): Readonly<ReporteConsolidadoFiltros> {
  const reunionId = numeroOpcional(formulario.reunionId);
  const usuarioAsignadoId = numeroOpcional(formulario.usuarioAsignadoId);
  const usuarioReportaId = numeroOpcional(formulario.usuarioReportaId);
  const comunaId = numeroOpcional(formulario.comunaId);
  const sinAsignar = booleanoOpcional(formulario.sinAsignar);
  const origenCafeConJesus = booleanoOpcional(formulario.origenCafeConJesus);
  const hitoTresSemanasCumplido = booleanoOpcional(formulario.hitoTresSemanasCumplido);
  const conGdc = booleanoOpcional(formulario.conGdc);
  const texto = formulario.texto.trim();

  return Object.freeze({
    desde: formulario.desde,
    hasta: formulario.hasta,
    alcance: formulario.alcance,
    ...(reunionId !== undefined ? { reunionId } : {}),
    ...(formulario.estado !== '' ? { estado: formulario.estado } : {}),
    ...(usuarioAsignadoId !== undefined ? { usuarioAsignadoId } : {}),
    ...(usuarioReportaId !== undefined ? { usuarioReportaId } : {}),
    ...(sinAsignar !== undefined ? { sinAsignar } : {}),
    ...(comunaId !== undefined ? { comunaId } : {}),
    ...(origenCafeConJesus !== undefined ? { origenCafeConJesus } : {}),
    ...(hitoTresSemanasCumplido !== undefined ? { hitoTresSemanasCumplido } : {}),
    ...(conGdc !== undefined ? { conGdc } : {}),
    ...(texto !== '' ? { texto } : {}),
  });
}

export function crearNombreArchivoPredeterminado(fecha: Date): string {
  return `reporte-consolidados-${formatearFechaLocal(fecha)}.xlsx`;
}

function limpiarNombreArchivo(nombre: string, fallback: string): string {
  const ultimoSegmento = nombre.split(/[\\/]/).at(-1)?.trim() ?? '';
  const seguro = ultimoSegmento.replace(/[\u0000-\u001f\u007f]/g, '');
  return seguro || fallback;
}

function decodificarNombreRfc5987(valor: string): string {
  const sinComillas = valor.trim().replace(/^"|"$/g, '');
  const coincidencia = /^[^']*'[^']*'(.*)$/.exec(sinComillas);
  const codificado = coincidencia?.[1] ?? sinComillas;

  try {
    return decodeURIComponent(codificado);
  } catch {
    return codificado;
  }
}

export function extraerNombreArchivoReporte(
  contentDisposition: string | null,
  fallback: string,
): string {
  if (contentDisposition === null || contentDisposition.trim() === '') {
    return fallback;
  }

  const rfc5987 = /filename\*\s*=\s*(?:"([^"]+)"|([^;]+))/i.exec(contentDisposition);
  const valorRfc5987 = rfc5987?.[1] ?? rfc5987?.[2];
  if (valorRfc5987 !== undefined) {
    const nombre = decodificarNombreRfc5987(valorRfc5987);
    if (nombre.trim() !== '') {
      return limpiarNombreArchivo(nombre, fallback);
    }
  }

  const estandar = /filename\s*=\s*(?:"([^"]*)"|([^;]*))/i.exec(contentDisposition);
  const nombreEstandar = estandar?.[1] ?? estandar?.[2];
  return nombreEstandar === undefined
    ? fallback
    : limpiarNombreArchivo(nombreEstandar, fallback);
}

function valoresFormulario(
  filtros: ReporteConsolidadoFiltros,
): ReporteConsolidadoFormulario {
  return {
    desde: filtros.desde,
    hasta: filtros.hasta,
    reunionId: '',
    alcance: filtros.alcance,
    estado: '',
    usuarioAsignadoId: '',
    sinAsignar: '',
    usuarioReportaId: '',
    comunaId: '',
    origenCafeConJesus: '',
    hitoTresSemanasCumplido: '',
    conGdc: '',
    texto: '',
  };
}

function congelarPagina(pagina: ReporteConsolidadoPagina): ReporteConsolidadoPagina {
  return Object.freeze({
    ...pagina,
    content: Object.freeze([...pagina.content]),
  });
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function mensajeError(error: unknown, fallback: string): string {
  const payload = error instanceof HttpErrorResponse
    ? error.error as unknown
    : esRegistro(error)
      ? error['error']
      : null;

  if (typeof payload === 'string' && payload.trim() !== '') {
    return payload;
  }
  if (esRegistro(payload) && typeof payload['message'] === 'string') {
    return payload['message'];
  }

  return fallback;
}

@Component({
  selector: 'app-reportes-consolidados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reportes-consolidados.component.html',
  styleUrl: './reportes-consolidados.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesConsolidadosComponent implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly reporteService = inject(ReporteConsolidadoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly filtrosIniciales = crearFiltrosPredeterminados();
  private readonly filtrosAplicadosState = signal(this.filtrosIniciales);
  private readonly opcionesState = signal<ReporteConsolidadoOpciones>(OPCIONES_VACIAS);
  private readonly resultadoState = signal<ReporteConsolidadoPagina | null>(null);
  private readonly cargandoState = signal(false);
  private readonly errorCargaState = signal<string | null>(null);
  private readonly cargandoOpcionesState = signal(false);
  private readonly errorOpcionesState = signal<string | null>(null);
  private readonly descargandoState = signal(false);
  private readonly errorDescargaState = signal<string | null>(null);
  private readonly errorValidacionState = signal<string | null>(null);
  private readonly filtrosAvanzadosAbiertosState = signal(false);
  private readonly tamanoPaginaState = signal(TAMANO_PAGINA_PREDETERMINADO);
  private consultaActual?: Subscription;
  private secuenciaConsulta = 0;
  private ultimaPaginaSolicitada = 0;

  readonly filtrosForm = this.formBuilder.group({
    desde: this.formBuilder.control(this.filtrosIniciales.desde, {
      validators: [Validators.required, Validators.pattern(PATRON_FECHA_ISO)],
    }),
    hasta: this.formBuilder.control(this.filtrosIniciales.hasta, {
      validators: [Validators.required, Validators.pattern(PATRON_FECHA_ISO)],
    }),
    reunionId: this.formBuilder.control(''),
    alcance: this.formBuilder.control<ReporteConsolidadoAlcance>('TODOS'),
    estado: this.formBuilder.control<'' | ReporteConsolidadoEstado>(''),
    usuarioAsignadoId: this.formBuilder.control(''),
    sinAsignar: this.formBuilder.control<FiltroBooleano>(''),
    usuarioReportaId: this.formBuilder.control(''),
    comunaId: this.formBuilder.control(''),
    origenCafeConJesus: this.formBuilder.control<FiltroBooleano>(''),
    hitoTresSemanasCumplido: this.formBuilder.control<FiltroBooleano>(''),
    conGdc: this.formBuilder.control<FiltroBooleano>(''),
    texto: this.formBuilder.control(''),
  });

  readonly filtrosAplicados = this.filtrosAplicadosState.asReadonly();
  readonly opciones = this.opcionesState.asReadonly();
  readonly resultado = this.resultadoState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly errorCarga = this.errorCargaState.asReadonly();
  readonly cargandoOpciones = this.cargandoOpcionesState.asReadonly();
  readonly errorOpciones = this.errorOpcionesState.asReadonly();
  readonly descargando = this.descargandoState.asReadonly();
  readonly errorDescarga = this.errorDescargaState.asReadonly();
  readonly errorValidacion = this.errorValidacionState.asReadonly();
  readonly filtrosAvanzadosAbiertos = this.filtrosAvanzadosAbiertosState.asReadonly();
  readonly tamanoPagina = this.tamanoPaginaState.asReadonly();
  readonly tamanosPagina = TAMANOS_PAGINA;
  readonly filas = computed(() => this.resultadoState()?.content ?? FILAS_VACIAS);
  readonly totalElementos = computed(() => this.resultadoState()?.totalElements ?? 0);
  readonly puedeDescargar = computed(
    () => this.totalElementos() > 0 && !this.descargandoState(),
  );
  readonly primerElementoVisible = computed(() => {
    const resultado = this.resultadoState();
    return resultado === null || resultado.totalElements === 0
      ? 0
      : resultado.page * resultado.size + 1;
  });
  readonly ultimoElementoVisible = computed(() => {
    const resultado = this.resultadoState();
    return resultado === null
      ? 0
      : Math.min((resultado.page + 1) * resultado.size, resultado.totalElements);
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.consultaActual?.unsubscribe());
  }

  ngOnInit(): void {
    this.cargarOpciones();
    this.cargarPagina(0, TAMANO_PAGINA_PREDETERMINADO);
  }

  aplicarFiltros(): void {
    this.filtrosForm.markAllAsTouched();
    const formulario = this.filtrosForm.getRawValue();
    const errorFechas = validarRangoFechas(formulario.desde, formulario.hasta);

    if (errorFechas !== null) {
      this.errorValidacionState.set(errorFechas);
      return;
    }

    this.errorValidacionState.set(null);
    this.errorDescargaState.set(null);
    this.filtrosAplicadosState.set(crearSnapshotFiltros(formulario));
    this.cargarPagina(0, this.tamanoPaginaState());
  }

  limpiarFiltros(): void {
    const filtros = crearFiltrosPredeterminados();
    this.filtrosForm.reset(valoresFormulario(filtros));
    this.filtrosAplicadosState.set(filtros);
    this.tamanoPaginaState.set(TAMANO_PAGINA_PREDETERMINADO);
    this.filtrosAvanzadosAbiertosState.set(false);
    this.errorValidacionState.set(null);
    this.errorDescargaState.set(null);
    this.cargarPagina(0, TAMANO_PAGINA_PREDETERMINADO);
  }

  alternarFiltrosAvanzados(): void {
    this.filtrosAvanzadosAbiertosState.update(abiertos => !abiertos);
  }

  actualizarUsuarioAsignado(): void {
    if (this.filtrosForm.controls.usuarioAsignadoId.value !== '') {
      this.filtrosForm.controls.sinAsignar.setValue('');
    }
  }

  actualizarSituacionAsignacion(): void {
    if (this.filtrosForm.controls.sinAsignar.value === 'true') {
      this.filtrosForm.controls.usuarioAsignadoId.setValue('');
    }
  }

  cargarOpciones(): void {
    if (this.cargandoOpcionesState()) {
      return;
    }

    this.cargandoOpcionesState.set(true);
    this.errorOpcionesState.set(null);
    this.reporteService.obtenerOpciones()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoOpcionesState.set(false)),
      )
      .subscribe({
        next: opciones => {
          this.opcionesState.set(Object.freeze({
            reuniones: Object.freeze([...opciones.reuniones]),
            comunas: Object.freeze([...opciones.comunas]),
            usuarios: Object.freeze([...opciones.usuarios]),
          }));
        },
        error: error => {
          this.errorOpcionesState.set(mensajeError(
            error,
            'No fue posible cargar las opciones de filtros.',
          ));
        },
      });
  }

  reintentar(): void {
    this.cargarPagina(this.ultimaPaginaSolicitada, this.tamanoPaginaState());
  }

  irAPagina(pagina: number): void {
    const resultado = this.resultadoState();
    if (
      resultado === null
      || this.cargandoState()
      || pagina < 0
      || pagina >= resultado.totalPages
      || pagina === resultado.page
    ) {
      return;
    }

    this.cargarPagina(pagina, this.tamanoPaginaState());
  }

  cambiarTamanoPagina(valor: string): void {
    const tamano = Number(valor);
    if (!(TAMANOS_PAGINA as readonly number[]).includes(tamano)) {
      return;
    }

    this.tamanoPaginaState.set(tamano);
    this.cargarPagina(0, tamano);
  }

  exportar(): void {
    if (!this.puedeDescargar()) {
      return;
    }

    this.descargandoState.set(true);
    this.errorDescargaState.set(null);
    this.reporteService.exportar(this.filtrosAplicadosState())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.descargandoState.set(false)),
      )
      .subscribe({
        next: respuesta => {
          if (respuesta.body === null) {
            this.errorDescargaState.set('El archivo generado está vacío. Intenta nuevamente.');
            return;
          }

          const fallback = crearNombreArchivoPredeterminado(new Date());
          const nombre = extraerNombreArchivoReporte(
            respuesta.headers.get('Content-Disposition'),
            fallback,
          );

          try {
            this.descargarBlob(respuesta.body, nombre);
          } catch {
            this.errorDescargaState.set('No fue posible guardar el archivo descargado.');
          }
        },
        error: error => {
          this.errorDescargaState.set(mensajeError(
            error,
            'No fue posible generar el archivo Excel.',
          ));
        },
      });
  }

  etiquetaReunion(opcion: ReporteConsolidadoReunionOpcion): string {
    return opcion.nombre?.trim() || `Reunión #${opcion.id}`;
  }

  etiquetaComuna(opcion: ReporteConsolidadoComunaOpcion): string {
    return opcion.nombre?.trim() || `Comuna #${opcion.id}`;
  }

  etiquetaUsuario(opcion: ReporteConsolidadoUsuarioOpcion): string {
    const nombre = opcion.nombreCompleto?.trim();
    const username = opcion.username?.trim();
    if (nombre && username && nombre !== username) {
      return `${nombre} (${username})`;
    }
    return nombre || username || `Usuario #${opcion.id}`;
  }

  etiquetaEstado(registro: ReporteConsolidado): string {
    const descripcion = registro.estadoDescripcion?.trim();
    if (descripcion) {
      return descripcion;
    }
    return registro.estado === null ? 'Sin estado' : ETIQUETAS_ESTADO[registro.estado];
  }

  claseEstado(estado: ReporteConsolidadoEstado | null): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'estado-pendiente';
      case 'ASIGNADO':
        return 'estado-asignado';
      case 'EN_PROCESO':
        return 'estado-proceso';
      case 'GDC':
        return 'estado-gdc';
      case 'CERRADO':
        return 'estado-cerrado';
      default:
        return 'estado-desconocido';
    }
  }

  etiquetaHito(cumplido: boolean | null): string {
    if (cumplido === null) {
      return 'Sin registro';
    }
    return cumplido ? 'Cumplido' : 'Pendiente';
  }

  telefonoHref(telefono: string): string {
    return `tel:${telefono.replace(/[^\d+]/g, '')}`;
  }

  private cargarPagina(pagina: number, tamano: number): void {
    const secuencia = ++this.secuenciaConsulta;
    this.consultaActual?.unsubscribe();
    this.ultimaPaginaSolicitada = pagina;
    this.cargandoState.set(true);
    this.errorCargaState.set(null);
    this.resultadoState.set(null);

    const consulta: ReporteConsolidadoConsulta = Object.freeze({
      ...this.filtrosAplicadosState(),
      page: pagina,
      size: tamano,
    });

    this.consultaActual = this.reporteService.consultar(consulta)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (secuencia === this.secuenciaConsulta) {
            this.cargandoState.set(false);
          }
        }),
      )
      .subscribe({
        next: resultado => {
          if (secuencia === this.secuenciaConsulta) {
            this.resultadoState.set(congelarPagina(resultado));
          }
        },
        error: error => {
          if (secuencia === this.secuenciaConsulta) {
            this.errorCargaState.set(mensajeError(
              error,
              'No fue posible cargar el reporte de consolidados.',
            ));
          }
        },
      });
  }

  private descargarBlob(blob: Blob, nombre: string): void {
    const urlApi = this.document.defaultView?.URL;
    if (urlApi === undefined) {
      throw new Error('La descarga no está disponible en este navegador.');
    }

    const url = urlApi.createObjectURL(blob);
    const enlace = this.document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.hidden = true;
    this.document.body.append(enlace);

    try {
      enlace.click();
    } finally {
      enlace.remove();
      urlApi.revokeObjectURL(url);
    }
  }
}
