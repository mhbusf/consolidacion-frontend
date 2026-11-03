import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { Comuna } from '../../../core/models/consolidado.model';
import { EncuentroInscripcion } from '../../../core/models/encuentro-poder.model';
import { ComunaService } from '../../../core/services/comuna.service';
import { HttpErrorMapperService } from '../../../core/services/http-error-mapper.service';
import { LoggerService } from '../../../core/services/logger.service';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';
import { TelefonoChilenoValidator } from '../../../shared/validators/telefono-chileno.validator';

@Component({
  selector: 'app-encuentro-participantes-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './encuentro-participantes-admin.component.html',
  styleUrl: './encuentro-participantes-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncuentroParticipantesAdminComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EncuentroPoderService);
  private readonly comunaService = inject(ComunaService);
  private readonly errorMapper = inject(HttpErrorMapperService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);
  private saveRequest?: Subscription;
  private loadSequence = 0;
  private editSequence = 0;

  readonly cicloId = input.required<number>();
  readonly cicloNombre = input.required<string>();
  readonly actualizada = output<void>();
  readonly inscripciones = signal<EncuentroInscripcion[]>([]);
  readonly busqueda = signal('');
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly editando = signal<EncuentroInscripcion | null>(null);
  readonly guardando = signal(false);
  readonly recargandoRevision = signal(false);
  readonly errorEdicion = signal('');
  readonly comunasPorProvincia = signal<{ provincia: string; comunas: Comuna[] }[]>([]);
  readonly cargandoComunas = signal(true);
  readonly errorComunas = signal('');
  readonly form = this.fb.nonNullable.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(180)]],
    telefono: ['', [Validators.required, Validators.maxLength(30), TelefonoChilenoValidator.validarConCodigoPais()]],
    comuna: [{ value: '', disabled: true }],
    invitadoPor: ['', Validators.maxLength(180)],
    tiempoCatedral: ['', Validators.maxLength(100)],
  });
  readonly filtradas = computed(() => {
    const termino = this.busqueda().trim().toLocaleLowerCase('es');
    if (!termino) return this.inscripciones();
    return this.inscripciones().filter(item =>
      `${item.persona.nombreCompleto} ${item.persona.telefono} ${item.persona.comuna ?? ''} ${item.invitadoPor ?? ''}`
        .toLocaleLowerCase('es').includes(termino));
  });

  constructor() {
    effect(onCleanup => {
      const cicloId = this.cicloId();
      const sequence = ++this.loadSequence;
      this.busqueda.set('');
      this.saveRequest?.unsubscribe();
      ++this.editSequence;
      this.guardando.set(false);
      this.recargandoRevision.set(false);
      this.editando.set(null);
      this.errorEdicion.set('');
      this.form.reset();
      this.cargando.set(true);
      this.errorCarga.set('');
      const subscription = this.service.inscritos(cicloId).pipe(
        finalize(() => { if (sequence === this.loadSequence) this.cargando.set(false); }),
      ).subscribe({
        next: inscripciones => { if (sequence === this.loadSequence && this.cicloId() === cicloId) this.inscripciones.set(inscripciones); },
        error: error => {
          this.logger.httpError('encuentro.participants.load', error);
          if (sequence === this.loadSequence && this.cicloId() === cicloId) {
            this.errorCarga.set(this.errorMapper.message(error, { fallback: 'No fue posible cargar los participantes del ciclo.' }));
          }
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
    this.cargarComunas();
  }

  cargar(): void {
    const cicloId = this.cicloId();
    const sequence = ++this.loadSequence;
    this.cargando.set(true);
    this.errorCarga.set('');
    this.service.inscritos(cicloId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { if (sequence === this.loadSequence) this.cargando.set(false); }),
    ).subscribe({
      next: inscripciones => { if (sequence === this.loadSequence && this.cicloId() === cicloId) this.inscripciones.set(inscripciones); },
      error: error => {
        this.logger.httpError('encuentro.participants.reload', error);
        if (sequence === this.loadSequence && this.cicloId() === cicloId) {
          this.errorCarga.set(this.errorMapper.message(error, { fallback: 'No fue posible cargar los participantes del ciclo.' }));
        }
      },
    });
  }

  abrir(inscripcion: EncuentroInscripcion): void {
    ++this.editSequence;
    this.recargandoRevision.set(false);
    this.editando.set(inscripcion);
    this.errorEdicion.set('');
    this.form.setValue({
      nombreCompleto: inscripcion.persona.nombreCompleto,
      telefono: inscripcion.persona.telefono,
      comuna: inscripcion.persona.comuna ?? '',
      invitadoPor: inscripcion.invitadoPor ?? '',
      tiempoCatedral: inscripcion.tiempoCatedral ?? '',
    });
    this.form.markAsPristine();
  }

  cerrar(): void {
    if (this.guardando()) return;
    ++this.editSequence;
    this.recargandoRevision.set(false);
    this.editando.set(null);
    this.errorEdicion.set('');
    this.form.reset();
  }

  guardar(): void {
    const inscripcion = this.editando();
    if (!inscripcion || this.guardando() || this.recargandoRevision()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const cicloId = this.cicloId();
    const request = { ...this.form.getRawValue(), personaRevision: inscripcion.personaRevision };
    this.guardando.set(true);
    this.errorEdicion.set('');
    this.saveRequest = this.service.actualizarInscripcion(inscripcion.id, request).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.guardando.set(false)),
    ).subscribe({
      next: actualizada => {
        if (this.cicloId() !== cicloId) return;
        this.inscripciones.update(items => items.map(item => item.id === actualizada.id ? actualizada : item));
        this.editando.set(null);
        this.actualizada.emit();
      },
      error: error => {
        this.logger.httpError('encuentro.participants.update', error);
        if (this.esRevisionObsoleta(error)) {
          this.errorEdicion.set('Los datos cambiaron mientras editabas. Estamos cargando la versión actual...');
          this.recargarEdicion(inscripcion.id, cicloId);
          return;
        }
        this.errorEdicion.set(this.mensajeErrorEdicion(error));
      },
    });
  }

  comunaFueraDelCatalogo(): string | null {
    const comuna = this.form.controls.comuna.value;
    if (!comuna || this.comunasPorProvincia().some(grupo => grupo.comunas.some(item => item.nombre === comuna))) return null;
    return comuna;
  }

  private cargarComunas(): void {
    this.cargandoComunas.set(true);
    this.errorComunas.set('');
    this.comunaService.listarTodas().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoComunas.set(false)),
    ).subscribe({
      next: comunas => {
        const grupos = comunas.reduce((map, comuna) => {
          const lista = map.get(comuna.provincia) ?? [];
          lista.push(comuna);
          map.set(comuna.provincia, lista);
          return map;
        }, new Map<string, Comuna[]>());
        this.comunasPorProvincia.set([...grupos]
          .map(([provincia, lista]) => ({
            provincia,
            comunas: lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
          }))
          .sort((a, b) => a.provincia.localeCompare(b.provincia, 'es')));
        this.form.controls.comuna.enable({ emitEvent: false });
      },
      error: error => {
        this.logger.httpError('encuentro.participants.load-communes', error);
        this.errorComunas.set('No fue posible cargar el catálogo de comunas. Puedes conservar el valor actual.');
        this.form.controls.comuna.enable({ emitEvent: false });
      },
    });
  }

  private recargarEdicion(inscripcionId: number, cicloId: number): void {
    const sequence = ++this.editSequence;
    this.recargandoRevision.set(true);
    this.service.inscritos(cicloId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: inscripciones => {
        if (sequence !== this.editSequence || this.cicloId() !== cicloId) return;
        this.inscripciones.set(inscripciones);
        const actual = inscripciones.find(item => item.id === inscripcionId);
        if (!actual) {
          this.editando.set(null);
          this.errorCarga.set('La inscripción ya no está disponible.');
          return;
        }
        this.abrir(actual);
        this.errorEdicion.set('Los datos fueron actualizados por otra persona. Revisa la versión recargada antes de guardar.');
      },
      error: error => {
        this.logger.httpError('encuentro.participants.reload-conflict', error);
        if (sequence === this.editSequence && this.cicloId() === cicloId) {
          this.recargandoRevision.set(false);
          this.errorEdicion.set('Los datos cambiaron y no fue posible recargarlos. Cierra el formulario e intenta nuevamente.');
        }
      },
    });
  }

  private esRevisionObsoleta(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 409
      && error.error && typeof error.error === 'object' && error.error.code === 'STALE_REVISION';
  }

  private mensajeErrorEdicion(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object'
      && typeof error.error.message === 'string') return error.error.message;
    return this.errorMapper.message(error, { fallback: 'No fue posible guardar los cambios.' });
  }
}
