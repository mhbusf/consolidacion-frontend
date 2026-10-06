import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EncuentroMentorAsistenciaParticipante,
  EncuentroMentorClase,
  EncuentroMentorCiclo,
} from '../../../core/models/encuentro-mentoria.model';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';
import { WhatsAppUrlPipe } from '../../../shared/pipes/whatsapp-url.pipe';

@Component({
  selector: 'app-mentor-asistencia',
  standalone: true,
  imports: [FormsModule, WhatsAppUrlPipe],
  templateUrl: './mentor-asistencia.component.html',
  styleUrls: ['./mentor-asistencia.component.css', './mentor-whatsapp.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorAsistenciaComponent implements OnInit {
  private readonly service = inject(EncuentroMentoriaService);
  private asistenciaRequestId = 0;

  readonly ciclos = signal<EncuentroMentorCiclo[]>([]);
  readonly cicloId = signal<number | null>(null);
  readonly claseId = signal<number | null>(null);
  readonly participantes = signal<EncuentroMentorAsistenciaParticipante[]>([]);
  readonly busqueda = signal('');
  readonly cargandoCiclos = signal(true);
  readonly cargandoAsistencia = signal(false);
  readonly error = signal('');
  readonly errorAccion = signal('');
  readonly guardando = signal<ReadonlySet<number>>(new Set());

  readonly cicloSeleccionado = computed(() => this.ciclos().find(ciclo => ciclo.id === this.cicloId()) ?? null);
  readonly clases = computed(() => [...(this.cicloSeleccionado()?.clases ?? [])].sort((a, b) => a.orden - b.orden));
  readonly claseSeleccionada = computed(() => this.clases().find(clase => clase.id === this.claseId()) ?? null);
  readonly participantesFiltrados = computed(() => {
    const term = this.normalizarBusqueda(this.busqueda());
    if (!term) return this.participantes();
    return this.participantes().filter(participante =>
      this.normalizarBusqueda(participante.nombreCompleto).includes(term),
    );
  });

  ngOnInit(): void {
    this.cargarCiclos();
  }

  cargarCiclos(): void {
    this.cargandoCiclos.set(true);
    this.error.set('');
    this.service.ciclosAsistencia().subscribe({
      next: ciclos => {
        this.ciclos.set(ciclos);
        this.cargandoCiclos.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar los ciclos. Intenta nuevamente.');
        this.cargandoCiclos.set(false);
      },
    });
  }

  seleccionarCiclo(value: string): void {
    this.asistenciaRequestId++;
    this.cicloId.set(value ? Number(value) : null);
    this.claseId.set(null);
    this.participantes.set([]);
    this.busqueda.set('');
    this.error.set('');
    this.errorAccion.set('');
    this.cargandoAsistencia.set(false);
  }

  seleccionarClase(value: string): void {
    this.asistenciaRequestId++;
    const claseId = value ? Number(value) : null;
    const clase = this.clases().find(item => item.id === claseId);
    this.claseId.set(claseId);
    this.participantes.set([]);
    this.busqueda.set('');
    this.error.set('');
    this.errorAccion.set('');
    this.cargandoAsistencia.set(false);
    if (!claseId || !clase || !this.claseHabilitada(clase)) return;
    this.cargarAsistencia();
  }

  cargarAsistencia(): void {
    const cicloId = this.cicloId();
    const clase = this.claseSeleccionada();
    if (!cicloId || !clase || !this.claseHabilitada(clase)) return;

    this.cargandoAsistencia.set(true);
    this.error.set('');
    const requestId = ++this.asistenciaRequestId;
    this.service.asistenciaClase(cicloId, clase.id).subscribe({
      next: asistencia => {
        if (requestId !== this.asistenciaRequestId) return;
        this.participantes.set(asistencia.participantes);
        this.cargandoAsistencia.set(false);
      },
      error: () => {
        if (requestId !== this.asistenciaRequestId) return;
        this.error.set('No fue posible cargar la asistencia de esta clase. Intenta nuevamente.');
        this.cargandoAsistencia.set(false);
      },
    });
  }

  marcarPresente(participante: EncuentroMentorAsistenciaParticipante): void {
    const claseId = this.claseId();
    if (!claseId || participante.presente || this.guardando().has(participante.personaId)) return;

    this.errorAccion.set('');
    this.guardando.update(ids => new Set(ids).add(participante.personaId));
    this.service.marcarPresente(participante.personaId, claseId).subscribe({
      next: () => {
        if (this.claseId() === claseId) {
          this.participantes.update(items => items.map(item =>
            item.personaId === participante.personaId ? { ...item, presente: true } : item,
          ));
        }
        this.quitarGuardando(participante.personaId);
      },
      error: () => {
        if (this.claseId() === claseId) {
          this.errorAccion.set(`No fue posible registrar la asistencia de ${participante.nombreCompleto}.`);
        }
        this.quitarGuardando(participante.personaId);
      },
    });
  }

  claseHabilitada(clase: EncuentroMentorClase): boolean {
    return clase.obligatoria && clase.estado !== 'PROGRAMADA';
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  private normalizarBusqueda(value: string): string {
    return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  }

  private quitarGuardando(personaId: number): void {
    this.guardando.update(ids => {
      const updated = new Set(ids);
      updated.delete(personaId);
      return updated;
    });
  }
}
