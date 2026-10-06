import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { EncuentroMentorFeedback, EncuentroMentorParticipanteDetalle } from '../../../core/models/encuentro-mentoria.model';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';
import { WhatsAppUrlPipe } from '../../../shared/pipes/whatsapp-url.pipe';

const textoNoVacio = (control: AbstractControl<string>): ValidationErrors | null =>
  control.value.trim() ? null : { required: true };

@Component({
  selector: 'app-mentor-participante-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, WhatsAppUrlPipe],
  templateUrl: './mentor-participante-detail.component.html',
  styleUrls: ['./mentor-participante-detail.component.css', './mentor-whatsapp.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorParticipanteDetailComponent implements OnInit {
  private readonly service = inject(EncuentroMentoriaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inscripcionId = Number(this.route.snapshot.paramMap.get('inscripcionId'));

  readonly participante = signal<EncuentroMentorParticipanteDetalle | null>(null);
  readonly feedback = signal<EncuentroMentorFeedback[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly errorFeedback = signal('');
  readonly comentario = new FormControl('', {
    nonNullable: true,
    validators: [textoNoVacio, Validators.maxLength(5000)],
  });

  ngOnInit(): void {
    if (!Number.isInteger(this.inscripcionId) || this.inscripcionId <= 0) {
      void this.router.navigate(['/encuentro-poder/mentor']);
      return;
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({
      participante: this.service.participante(this.inscripcionId),
      feedback: this.service.feedback(this.inscripcionId),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando.set(false)),
    ).subscribe({
      next: ({ participante, feedback }) => {
        this.participante.set(participante);
        this.feedback.set(feedback);
      },
      error: error => this.error.set(this.mensajeError(error, 'No fue posible cargar el detalle del participante.')),
    });
  }

  guardarFeedback(): void {
    if (this.enviando()) return;
    const comentario = this.comentario.value.trim();
    if (!comentario || this.comentario.invalid) {
      this.comentario.markAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorFeedback.set('');
    this.service.crearFeedback(this.inscripcionId, { comentario }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando.set(false)),
    ).subscribe({
      next: creado => {
        this.feedback.update(actual => [creado, ...actual]);
        this.participante.update(actual => actual ? { ...actual, ultimoFeedback: creado } : actual);
        this.comentario.reset();
      },
      error: error => this.errorFeedback.set(this.mensajeError(error, 'No fue posible guardar el feedback. Tu texto se conservó.')),
    });
  }

  porcentaje(): number {
    const participante = this.participante();
    if (!participante) return 0;
    if (Number.isFinite(participante.porcentajeProgreso)) {
      return Math.min(100, Math.max(0, participante.porcentajeProgreso));
    }
    return participante.totalClases
      ? Math.round(participante.clasesCompletadas / participante.totalClases * 100)
      : 0;
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (error.status === 404) return 'El participante no existe o ya no está asignado a tu mentoría.';
    if (error.status === 403) return 'No tienes acceso a este participante.';
    const message = error.error && typeof error.error === 'object' && typeof error.error.message === 'string'
      ? error.error.message
      : null;
    return message || fallback;
  }
}
