import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  EncuentroCiclo,
  EncuentroDashboard,
  EncuentroParticipante,
  EncuentroTipoReporte,
} from '../../../core/models/encuentro-poder.model';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';

@Component({
  selector: 'app-encuentro-reportes',
  standalone: true,
  templateUrl: './encuentro-reportes.component.html',
  styleUrl: './encuentro-reportes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncuentroReportesComponent {
  private readonly service = inject(EncuentroPoderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private requestSequence = 0;
  private exportSequence = 0;

  readonly ciclos = signal<EncuentroCiclo[]>([]);
  readonly cicloSeleccionado = signal<number | null>(null);
  readonly dashboard = signal<EncuentroDashboard | null>(null);
  readonly cargandoCiclos = signal(true);
  readonly cargando = signal(false);
  readonly exportando = signal<EncuentroTipoReporte | null>(null);
  readonly error = signal('');
  readonly accionError = signal<'CICLOS' | 'DASHBOARD' | null>(null);

  readonly clasesObligatorias = computed(() => {
    const data = this.dashboard();
    if (!data) return [];
    const ids = new Set(data.ciclo.clases.filter(clase => clase.obligatoria).map(clase => clase.id));
    return data.clases.filter(clase => ids.has(clase.claseId));
  });

  readonly noCumplen = computed(() => {
    const data = this.dashboard();
    if (!data) return [];
    return data.participantes.filter(participante => this.clasesAusentesFinalizadas(participante).length > 0);
  });

  readonly enProceso = computed(() => {
    const data = this.dashboard();
    if (!data) return [];
    const noCumplenIds = new Set(this.noCumplen().map(participante => participante.persona.id));
    return data.participantes.filter(participante =>
      participante.estado !== 'COMPLETO' && !noCumplenIds.has(participante.persona.id));
  });

  readonly noGraduados = computed(() =>
    this.dashboard()?.participantes.filter(participante => participante.estado !== 'COMPLETO') ?? []);

  constructor() {
    this.cargarCiclos();
  }

  seleccionarCiclo(event: Event): void {
    const cicloId = Number((event.target as HTMLSelectElement).value);
    if (!Number.isFinite(cicloId) || cicloId <= 0) return;
    this.exportSequence++;
    this.exportando.set(null);
    this.cicloSeleccionado.set(cicloId);
    this.cargarDashboard(cicloId);
  }

  recargar(): void {
    if (this.accionError() === 'CICLOS') {
      this.cargarCiclos();
      return;
    }
    const cicloId = this.cicloSeleccionado();
    if (cicloId) this.cargarDashboard(cicloId);
  }

  exportar(tipo: EncuentroTipoReporte): void {
    const cicloId = this.cicloSeleccionado();
    const data = this.dashboard();
    if (!cicloId || !data || this.exportando()) return;

    this.error.set('');
    this.accionError.set(null);
    this.exportando.set(tipo);
    const sequence = ++this.exportSequence;
    this.service.exportarReporte(cicloId, tipo).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (sequence === this.exportSequence) this.exportando.set(null);
      }),
    ).subscribe({
      next: blob => {
        if (sequence === this.exportSequence) this.descargar(blob, this.nombreArchivo(data.ciclo, tipo));
      },
      error: error => {
        if (sequence !== this.exportSequence) return;
        this.error.set(this.mensajeError(error, 'No fue posible generar el reporte Excel.'));
      },
    });
  }

  porcentaje(presentes: number, inscritos: number): number {
    return inscritos ? Math.round(presentes * 100 / inscritos) : 0;
  }

  clasesAusentesFinalizadas(participante: EncuentroParticipante): string[] {
    const data = this.dashboard();
    if (!data) return [];
    const presentes = new Set(participante.asistencias.map(asistencia => asistencia.claseId));
    return data.ciclo.clases
      .filter(clase => clase.obligatoria && clase.estado === 'FINALIZADA' && !presentes.has(clase.id))
      .sort((a, b) => a.orden - b.orden)
      .map(clase => clase.nombre);
  }

  situacion(participante: EncuentroParticipante): 'GRADUADO' | 'NO CUMPLE' | 'EN PROCESO' {
    if (participante.estado === 'COMPLETO') return 'GRADUADO';
    return this.clasesAusentesFinalizadas(participante).length ? 'NO CUMPLE' : 'EN PROCESO';
  }

  private cargarCiclos(): void {
    this.cargandoCiclos.set(true);
    this.error.set('');
    this.accionError.set(null);
    this.service.ciclos().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoCiclos.set(false)),
    ).subscribe({
      next: ciclos => {
        this.ciclos.set(ciclos);
        if (ciclos.length) {
          this.cicloSeleccionado.set(ciclos[0].id);
          this.cargarDashboard(ciclos[0].id);
        }
      },
      error: error => {
        this.accionError.set('CICLOS');
        this.error.set(this.mensajeError(error, 'No fue posible cargar los ciclos.'));
      },
    });
  }

  private cargarDashboard(cicloId: number): void {
    const sequence = ++this.requestSequence;
    this.cargando.set(true);
    this.error.set('');
    this.accionError.set(null);
    this.service.dashboard(cicloId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (sequence === this.requestSequence) this.cargando.set(false);
      }),
    ).subscribe({
      next: data => {
        if (sequence === this.requestSequence) this.dashboard.set(data);
      },
      error: error => {
        if (sequence !== this.requestSequence) return;
        this.dashboard.set(null);
        this.accionError.set('DASHBOARD');
        this.error.set(this.mensajeError(error, 'No fue posible cargar el dashboard del ciclo.'));
      },
    });
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = nombre;
    anchor.hidden = true;
    this.document.body.appendChild(anchor);
    try {
      anchor.click();
    } finally {
      anchor.remove();
      URL.revokeObjectURL(url);
    }
  }

  private nombreArchivo(ciclo: EncuentroCiclo, tipo: EncuentroTipoReporte): string {
    const cicloNombre = ciclo.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `encuentro_poder_${cicloNombre || ciclo.id}_${tipo.toLowerCase()}.xlsx`;
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    return error.error && typeof error.error === 'object' && typeof error.error.message === 'string'
      ? error.error.message
      : fallback;
  }
}
