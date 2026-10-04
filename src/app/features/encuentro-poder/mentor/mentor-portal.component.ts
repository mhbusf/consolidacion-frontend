import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EncuentroMentorParticipante } from '../../../core/models/encuentro-mentoria.model';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';

@Component({
  selector: 'app-mentor-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mentor-portal.component.html',
  styleUrl: './mentor-portal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorPortalComponent implements OnInit {
  private readonly service = inject(EncuentroMentoriaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly participantes = signal<EncuentroMentorParticipante[]>([]);
  readonly busqueda = signal('');
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly participantesFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLocaleLowerCase('es');
    if (!termino) return this.participantes();
    return this.participantes().filter(participante =>
      `${participante.nombreCompleto} ${participante.telefono} ${participante.cicloNombre}`
        .toLocaleLowerCase('es')
        .includes(termino),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (this.cargando() && this.participantes().length) return;
    this.cargando.set(true);
    this.error.set('');
    this.service.misParticipantes().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando.set(false)),
    ).subscribe({
      next: participantes => this.participantes.set(participantes),
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
}
