import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { EncuentroMentorCiclo, EncuentroMentorParticipante, EncuentroMentorResumenPortal } from '../../../core/models/encuentro-mentoria.model';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';
import { WhatsAppUrlPipe } from '../../../shared/pipes/whatsapp-url.pipe';

@Component({
  selector: 'app-mentor-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, WhatsAppUrlPipe],
  templateUrl: './mentor-portal.component.html',
  styleUrls: ['./mentor-portal.component.css', './mentor-whatsapp.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorPortalComponent implements OnInit {
  private readonly service = inject(EncuentroMentoriaService);
  private readonly destroyRef = inject(DestroyRef);
  private loadSequence = 0;

  readonly ciclos = signal<EncuentroMentorCiclo[]>([]);
  readonly cicloId = signal<number | null>(null);
  readonly participantes = signal<EncuentroMentorParticipante[]>([]);
  readonly resumen = signal<EncuentroMentorResumenPortal | null>(null);
  readonly busqueda = signal('');
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly errorResumen = signal('');
  readonly participantesFiltrados = computed(() => {
    const termino = this.normalizar(this.busqueda());
    if (!termino) return this.participantes();
    return this.participantes().filter(participante =>
      this.normalizar(`${participante.nombreCompleto} ${participante.telefono} ${participante.cicloNombre}`)
        .includes(termino),
    );
  });
  readonly secciones = computed(() => {
    const participantes = this.participantesFiltrados();
    return [
      {
        id: 'activas', titulo: 'Participantes activos', etapa: 'ACTIVA' as const,
        descripcion: 'Acompañamiento del ciclo en curso.',
        participantes: participantes.filter(item => item.etapaMentoria === 'ACTIVA'),
      },
      {
        id: 'cierre', titulo: 'Periodo de cierre', etapa: 'CIERRE' as const,
        descripcion: 'Una semana para registrar el mensaje de cierre después de la tercera clase.',
        participantes: participantes.filter(item => item.etapaMentoria === 'CIERRE'),
      },
      {
        id: 'historial', titulo: 'Historial', etapa: 'HISTORICA' as const,
        descripcion: 'Seguimientos anteriores disponibles para consulta y nuevos mensajes.',
        participantes: participantes.filter(item => item.etapaMentoria === 'HISTORICA'),
      },
    ];
  });
  readonly enSeguimiento = computed(() => this.participantes().filter(
    item => item.etapaMentoria === 'ACTIVA' || item.etapaMentoria === 'CIERRE',
  ).length);

  ngOnInit(): void {
    this.cargarCiclos();
  }

  cargarCiclos(): void {
    this.cargando.set(true);
    this.error.set('');
    this.service.ciclosAsistencia().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ciclos => {
        this.ciclos.set(ciclos);
        const seleccionado = ciclos.find(ciclo => ciclo.estado === 'ABIERTO') ?? ciclos[0] ?? null;
        this.cicloId.set(seleccionado?.id ?? null);
        if (seleccionado) this.cargar();
        else this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar los ciclos disponibles. Intenta nuevamente.');
        this.cargando.set(false);
      },
    });
  }

  seleccionarCiclo(value: string): void {
    const cicloId = value ? Number(value) : null;
    if (!cicloId || cicloId === this.cicloId()) return;
    this.cicloId.set(cicloId);
    this.busqueda.set('');
    this.participantes.set([]);
    this.resumen.set(null);
    this.cargar();
  }

  reintentar(): void {
    if (this.ciclos().length) this.cargar();
    else this.cargarCiclos();
  }

  cargar(): void {
    if (this.cargando() && this.participantes().length) return;
    const cicloId = this.cicloId();
    const sequence = ++this.loadSequence;
    this.cargando.set(true);
    this.error.set('');
    this.errorResumen.set('');
    forkJoin({
      participantes: this.service.misParticipantes(cicloId),
      resumen: this.service.resumenPortal(cicloId).pipe(catchError(() => {
        this.errorResumen.set('No fue posible cargar los indicadores del ciclo.');
        return of(null);
      })),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { if (sequence === this.loadSequence) this.cargando.set(false); }),
    ).subscribe({
      next: ({ participantes, resumen }) => {
        if (sequence !== this.loadSequence || this.cicloId() !== cicloId) return;
        this.participantes.set(resumen
          ? resumen.ciclo
            ? participantes.filter(participante => participante.cicloId === resumen.ciclo?.id)
            : []
          : participantes);
        this.resumen.set(resumen);
      },
      error: error => this.error.set(this.mensajeError(error)),
    });
  }

  progreso(participante: EncuentroMentorParticipante): number {
    if (Number.isFinite(participante.porcentajeProgreso)) {
      return Math.min(100, Math.max(0, participante.porcentajeProgreso));
    }
    return participante.totalClases
      ? Math.round(participante.clasesCompletadas / participante.totalClases * 100)
      : 0;
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'No tienes acceso a participantes asignados.';
    }
    return 'No fue posible cargar tus participantes. Intenta nuevamente.';
  }

  private normalizar(value: string): string {
    return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  }
}
