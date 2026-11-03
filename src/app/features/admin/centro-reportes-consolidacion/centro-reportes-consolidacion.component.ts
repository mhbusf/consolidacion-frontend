import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  ReporteConsolidacionEspecialFiltros,
  ReporteConsolidacionEspecialMetadata,
  ReporteConsolidacionEspecialPreview,
  TipoReporteConsolidacionEspecial,
} from '../../../core/models/reporte-consolidacion-especial.model';
import { ReporteConsolidadoOpciones } from '../../../core/models/reporte-consolidado.model';
import { ReporteConsolidacionEspecialService } from '../../../core/services/reporte-consolidacion-especial.service';
import { ReporteConsolidadoService } from '../../../core/services/reporte-consolidado.service';
import { extraerNombreArchivoReporte, formatearFechaLocal, validarRangoFechas } from '../reportes-consolidados/reportes-consolidados.component';

interface DefinicionReporte {
  readonly tipo: TipoReporteConsolidacionEspecial;
  readonly titulo: string;
  readonly descripcion: string;
  readonly contenido: string;
}

const REPORTES: readonly DefinicionReporte[] = [
  { tipo: 'seguimiento', titulo: 'Atrasos y seguimiento', descripcion: 'Prioriza obligaciones vencidas y responsables.', contenido: 'Persona, responsable, obligación, fecha esperada, días de atraso y último comentario.' },
  { tipo: 'cartera', titulo: 'Cartera por consolidador', descripcion: 'Compara carga y cumplimiento del equipo.', contenido: 'Hojas de resumen por consolidador y detalle completo de la cartera activa.' },
  { tipo: 'historico', titulo: 'Histórico de cierres', descripcion: 'Analiza cierres por su fecha real de cierre.', contenido: 'Tipo, motivo, GDC, responsable, reunión, comuna, duración y comentario de cierre.' },
  { tipo: 'ejecutivo', titulo: 'Resumen ejecutivo', descripcion: 'Obtén indicadores consolidados del período.', contenido: 'Indicadores, resultados por reunión, por consolidador y base detallada.' },
];

const OPCIONES_VACIAS: ReporteConsolidadoOpciones = { reuniones: [], comunas: [], usuarios: [] };

@Component({
  selector: 'app-centro-reportes-consolidacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './centro-reportes-consolidacion.component.html',
  styleUrl: './centro-reportes-consolidacion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CentroReportesConsolidacionComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly reportesService = inject(ReporteConsolidacionEspecialService);
  private readonly consolidadoService = inject(ReporteConsolidadoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  readonly reportes = REPORTES;
  opciones = OPCIONES_VACIAS;
  metadata: ReporteConsolidacionEspecialMetadata | null = null;
  previews: Partial<Record<TipoReporteConsolidacionEspecial, ReporteConsolidacionEspecialPreview>> = {};
  cargandoInicial = true;
  cargandoPreview = false;
  descargando: TipoReporteConsolidacionEspecial | null = null;
  errorInicial = '';
  errorPreview = '';
  errorDescarga = '';

  readonly form = this.fb.group({
    desde: ['', Validators.required],
    hasta: ['', Validators.required],
    reunionId: [''],
    usuarioAsignadoId: [''],
    comunaId: [''],
    tipoCierre: ['' as '' | 'GDC' | 'CERRADO'],
    motivo: [''],
    gdc: [''],
  });

  ngOnInit(): void {
    const hoy = new Date();
    this.form.patchValue({
      desde: formatearFechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      hasta: formatearFechaLocal(hoy),
    });
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.cargandoInicial = true;
    this.errorInicial = '';
    forkJoin({ metadata: this.reportesService.metadata(), opciones: this.consolidadoService.obtenerOpciones() })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargandoInicial = false))
      .subscribe({
        next: ({ metadata, opciones }) => {
          this.metadata = metadata;
          this.opciones = opciones;
          this.consultar();
        },
        error: () => this.errorInicial = 'No pudimos cargar los filtros de informes. Revisa tu conexión y vuelve a intentarlo.',
      });
  }

  consultar(): void {
    const filtros = this.filtros();
    if (!filtros) return;
    this.cargandoPreview = true;
    this.errorPreview = '';
    forkJoin({
      seguimiento: this.reportesService.preview('seguimiento', filtros),
      cartera: this.reportesService.preview('cartera', filtros),
      historico: this.reportesService.preview('historico', filtros),
      ejecutivo: this.reportesService.preview('ejecutivo', filtros),
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargandoPreview = false))
      .subscribe({
        next: previews => this.previews = previews,
        error: () => {
          this.previews = {};
          this.errorPreview = 'No pudimos calcular la vista previa. Ajusta los filtros o vuelve a intentarlo.';
        },
      });
  }

  descargar(tipo: TipoReporteConsolidacionEspecial): void {
    const filtros = this.filtros();
    if (!filtros || this.descargando) return;
    this.descargando = tipo;
    this.errorDescarga = '';
    this.reportesService.descargar(tipo, filtros)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.descargando = null))
      .subscribe({
        next: response => this.guardar(response, `${tipo}-${filtros.desde}-${filtros.hasta}.xlsx`),
        error: () => this.errorDescarga = 'No pudimos generar el Excel. Reduce el período o aplica más filtros y vuelve a intentarlo.',
      });
  }

  etiquetaUsuario(id: number, username: string | null, nombre: string | null): string {
    const visible = nombre?.trim() || username?.trim() || `Usuario #${id}`;
    return nombre && username && nombre !== username ? `${nombre} (${username})` : visible;
  }

  private filtros(): ReporteConsolidacionEspecialFiltros | null {
    const raw = this.form.getRawValue();
    const error = validarRangoFechas(raw.desde, raw.hasta);
    if (error) {
      this.errorPreview = error;
      this.form.markAllAsTouched();
      return null;
    }
    const numero = (valor: string): number | undefined => valor === '' ? undefined : Number(valor);
    return {
      desde: raw.desde,
      hasta: raw.hasta,
      reunionId: numero(raw.reunionId),
      usuarioAsignadoId: numero(raw.usuarioAsignadoId),
      comunaId: numero(raw.comunaId),
      tipoCierre: raw.tipoCierre || undefined,
      motivo: raw.motivo.trim() || undefined,
      gdc: raw.gdc.trim() || undefined,
    };
  }

  private guardar(response: HttpResponse<Blob>, fallback: string): void {
    if (!response.body) {
      this.errorDescarga = 'El archivo generado está vacío.';
      return;
    }
    const nombre = extraerNombreArchivoReporte(response.headers.get('Content-Disposition'), fallback);
    const urlApi = this.document.defaultView?.URL;
    if (!urlApi) return;
    const url = urlApi.createObjectURL(response.body);
    const enlace = this.document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.hidden = true;
    this.document.body.append(enlace);
    enlace.click();
    enlace.remove();
    urlApi.revokeObjectURL(url);
  }
}
