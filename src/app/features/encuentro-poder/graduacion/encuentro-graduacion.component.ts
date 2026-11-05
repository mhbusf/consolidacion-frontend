import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { EncuentroCiclo, EncuentroDashboard, EncuentroParticipante } from '../../../core/models/encuentro-poder.model';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';

type EstadoGraduacion = 'PENDIENTE' | 'COMPLETO';

@Component({
  selector: 'app-encuentro-graduacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './encuentro-graduacion.component.html',
  styleUrl: './encuentro-graduacion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncuentroGraduacionComponent implements OnInit {
  private readonly service = inject(EncuentroPoderService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageSize = 25;
  private dashboardRequest?: Subscription;
  private loadSequence = 0;

  readonly ciclos = signal<EncuentroCiclo[]>([]);
  readonly cicloId = signal<number | null>(null);
  readonly dashboard = signal<EncuentroDashboard | null>(null);
  readonly estado = signal<EstadoGraduacion>('PENDIENTE');
  readonly busqueda = signal('');
  readonly pagina = signal(0);
  readonly cargandoCiclos = signal(true);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly historial = signal<EncuentroParticipante | null>(null);
  readonly errorHistorial = signal('');

  readonly totalObligatorias = computed(() => this.dashboard()?.ciclo.clases.filter(clase => clase.obligatoria).length ?? 0);
  readonly participantes = computed(() => {
    const termino = this.normalizar(this.busqueda());
    const estado = this.estado();
    return (this.dashboard()?.participantes ?? [])
      .filter(participante => participante.estado === estado)
      .filter(participante => !termino || this.normalizar(
        `${participante.persona.nombreCompleto} ${participante.persona.telefono} ${participante.persona.comuna ?? ''}`,
      ).includes(termino))
      .sort((a, b) => estado === 'PENDIENTE'
        ? a.clasesFaltantes.length - b.clasesFaltantes.length
          || a.persona.nombreCompleto.localeCompare(b.persona.nombreCompleto, 'es', { sensitivity: 'base' })
        : a.persona.nombreCompleto.localeCompare(b.persona.nombreCompleto, 'es', { sensitivity: 'base' }));
  });
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.participantes().length / this.pageSize)));
  readonly participantesPagina = computed(() => {
    const inicio = this.pagina() * this.pageSize;
    return this.participantes().slice(inicio, inicio + this.pageSize);
  });

  ngOnInit(): void {
    this.service.ciclos().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoCiclos.set(false)),
    ).subscribe({
      next: ciclos => {
        this.ciclos.set(ciclos);
        const solicitado = Number(this.route.snapshot.queryParamMap.get('cicloId'));
        const seleccionado = ciclos.find(ciclo => ciclo.id === solicitado)
          ?? ciclos.find(ciclo => ciclo.estado === 'ABIERTO')
          ?? ciclos[0]
          ?? null;
        this.cicloId.set(seleccionado?.id ?? null);
        if (seleccionado) this.cargar();
      },
      error: error => this.error.set(this.mensajeError(error, 'No fue posible cargar los ciclos.')),
    });
  }

  seleccionarCiclo(value: string): void {
    const cicloId = value ? Number(value) : null;
    if (cicloId === this.cicloId()) return;
    this.cicloId.set(cicloId);
    this.dashboard.set(null);
    this.busqueda.set('');
    this.pagina.set(0);
    this.cargar();
  }

  seleccionarEstado(estado: EstadoGraduacion): void {
    this.estado.set(estado);
    this.pagina.set(0);
  }

  actualizarBusqueda(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(0);
  }

  cambiarPagina(delta: number): void {
    this.pagina.update(actual => Math.min(Math.max(actual + delta, 0), this.totalPaginas() - 1));
  }

  cargar(): void {
    const cicloId = this.cicloId();
    const sequence = ++this.loadSequence;
    this.dashboardRequest?.unsubscribe();
    this.error.set('');
    if (!cicloId) {
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.dashboardRequest = this.service.dashboard(cicloId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { if (sequence === this.loadSequence) this.cargando.set(false); }),
    ).subscribe({
      next: dashboard => {
        if (sequence !== this.loadSequence || this.cicloId() !== cicloId) return;
        this.dashboard.set(dashboard);
        this.pagina.set(0);
      },
      error: error => {
        if (sequence === this.loadSequence) this.error.set(this.mensajeError(error, 'No fue posible cargar el estado de graduación.'));
      },
    });
  }

  verHistorial(participante: EncuentroParticipante): void {
    this.errorHistorial.set('');
    this.service.historial(participante.persona.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: historial => this.historial.set(historial),
      error: error => this.errorHistorial.set(this.mensajeError(error, 'No fue posible cargar el historial.')),
    });
  }

  cerrarHistorial(): void {
    this.historial.set(null);
  }

  private normalizar(value: string): string {
    return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    const message = error.error && typeof error.error === 'object' && typeof error.error.message === 'string'
      ? error.error.message
      : null;
    return message || fallback;
  }
}
