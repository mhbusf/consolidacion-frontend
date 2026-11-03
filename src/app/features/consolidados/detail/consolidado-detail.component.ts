import { Component, OnInit, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { ComentarioService } from '../../../core/services/comentario.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  CerrarConsolidadoRequest,
  ConsolidadoResponse,
  MotivoCierre,
} from '../../../core/models/consolidado.model';
import { ComentarioResponse } from '../../../core/models/comentario.model';
import { NotificationService } from '../../../core/services/notification.service';
import { WhatsAppUrlPipe } from '../../../shared/pipes/whatsapp-url.pipe';
import { institutionalWhatsAppMessage } from '../../../shared/utils/institutional-whatsapp-message';
import { LoggerService } from '../../../core/services/logger.service';
import { HttpErrorMapperService } from '../../../core/services/http-error-mapper.service';

@Component({
  selector: 'app-consolidado-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, WhatsAppUrlPipe],
  templateUrl: './consolidado-detail.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './consolidado-detail.component.css'
})
export class ConsolidadoDetailComponent implements OnInit {
  @ViewChild('modalDialog') modalDialog?: ElementRef<HTMLElement>;

  consolidado: ConsolidadoResponse | null = null;
  consolidadoId = 0;
  comentarios: ComentarioResponse[] = [];
  nuevoComentario = '';
  isLoading = true;
  errorCarga = '';
  isLoadingComentarios = true;
  errorComentarios = '';
  isLoadingComentario = false;
  isUpdatingHito = false;
  isAdmin = false;
  origen = '';
  private queryParamsRetorno: Record<string, string> = {};

  // Modal de cierre con GDC
  mostrarModalGDC = false;
  gdcNumero = '';
  comentarioCierre = '';
  isClosing = false;

  // Modal de cierre sin GDC
  mostrarModalCierre = false;
  motivoCierre: MotivoCierre | null = null;
  observacionCierre = '';
  private modalTrigger: HTMLElement | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consolidadoService: ConsolidadoService,
    private comentarioService: ComentarioService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private logger: LoggerService,
    private errorMapper: HttpErrorMapperService
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.consolidadoId = id;
    this.origen = this.route.snapshot.queryParamMap.get('origen') || '';
    this.queryParamsRetorno = { ...this.route.snapshot.queryParams };
    delete this.queryParamsRetorno['origen'];
    delete this.queryParamsRetorno['returnUrl'];
    this.cargarDatos(id);
    this.cargarComentarios(id);
  }

  cargarDatos(id: number): void {
    this.isLoading = true;
    this.errorCarga = '';
    
    this.consolidadoService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.consolidado = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.logger.httpError('consolidados.detail.load', error);
        this.errorCarga = this.errorMapper.message(error, { fallback: 'No fue posible cargar el consolidado.' });
        this.isLoading = false;
      }
    });
  }

  reintentarDatos(): void {
    this.cargarDatos(this.consolidadoId);
  }

  cargarComentarios(id: number): void {
    this.isLoadingComentarios = true;
    this.errorComentarios = '';
    this.comentarioService.listar(id).subscribe({
      next: (data) => {
        this.comentarios = data;
        this.isLoadingComentarios = false;
      },
      error: (error) => {
        this.logger.httpError('consolidados.detail.load-comments', error);
        this.errorComentarios = this.errorMapper.message(error, { fallback: 'No fue posible cargar los comentarios.' });
        this.isLoadingComentarios = false;
      }
    });
  }

  agregarComentario(): void {
    if (!this.consolidado || this.esTerminal() || !this.nuevoComentario.trim()) {
      return;
    }

    this.isLoadingComentario = true;

    this.comentarioService.agregar(this.consolidado.id, {
      contenido: this.nuevoComentario
    }).subscribe({
      next: (comentario) => {
        this.comentarios.unshift(comentario);
        this.nuevoComentario = '';
        this.isLoadingComentario = false;
        this.notificationService.success('Comentario agregado');
      },
      error: (error) => {
        this.logger.httpError('consolidados.detail.add-comment', error);
        this.notificationService.error(this.errorMapper.message(error, { fallback: 'No pudimos guardar el comentario.' }));
        this.isLoadingComentario = false;
      }
    });
  }

  abrirModalGDC(event: Event): void {
    this.guardarTrigger(event);
    this.mostrarModalGDC = true;
    this.gdcNumero = '';
    this.comentarioCierre = '';
    this.enfocarModal();
  }

  cerrarModalGDC(): void {
    if (this.isClosing) return;

    this.mostrarModalGDC = false;
    this.gdcNumero = '';
    this.comentarioCierre = '';
    this.restaurarFoco();
  }

  abrirModalCierre(event: Event): void {
    this.guardarTrigger(event);
    this.mostrarModalCierre = true;
    this.motivoCierre = null;
    this.observacionCierre = '';
    this.enfocarModal();
  }

  cerrarModalCierre(): void {
    if (this.isClosing) return;

    this.mostrarModalCierre = false;
    this.motivoCierre = null;
    this.observacionCierre = '';
    this.restaurarFoco();
  }

  cerrarConGDC(): void {
    if (!this.consolidado || !this.gdcNumero.trim() || !this.comentarioCierre.trim()) {
      this.notificationService.error('Debes completar todos los campos');
      return;
    }

    this.isClosing = true;

    this.comentarioService.cerrarConGDC(
      this.consolidado.id,
      this.gdcNumero,
      this.comentarioCierre
    ).subscribe({
      next: () => {
        this.notificationService.success('Consolidado cerrado con GDC exitosamente');
        this.isClosing = false;
        this.cerrarModalGDC();
        if (this.consolidado) {
          this.cargarDatos(this.consolidado.id);
        }
      },
      error: (error) => {
        this.logger.httpError('consolidados.detail.close-gdc', error);
        this.notificationService.error(this.errorMapper.message(error, { fallback: 'No pudimos cerrar el seguimiento con GDC.' }));
        this.isClosing = false;
      }
    });
  }

  cerrarSinGDC(): void {
    if (!this.consolidado || !this.motivoCierre) {
      this.notificationService.error('Debes seleccionar un motivo de cierre');
      return;
    }

    const comentario = this.observacionCierre.trim();
    const request: CerrarConsolidadoRequest = {
      motivo: this.motivoCierre,
      ...(comentario ? { comentario } : {}),
    };

    this.isClosing = true;
    this.consolidadoService.cerrar(this.consolidado.id, request).subscribe({
      next: () => {
        this.isClosing = false;
        this.cerrarModalCierre();
        this.notificationService.success('Consolidado cerrado sin GDC exitosamente');
        if (this.consolidado) {
          this.cargarDatos(this.consolidado.id);
        }
      },
      error: (error) => {
        this.isClosing = false;
        this.logger.httpError('consolidados.detail.close', error);
        this.notificationService.error(this.errorMapper.message(error, { fallback: 'No pudimos cerrar el seguimiento.' }));
      }
    });
  }

  actualizarHitoTresSemanas(cumplido: boolean): void {
    if (!this.consolidado || this.esTerminal() || this.isUpdatingHito) return;

    this.isUpdatingHito = true;
    this.consolidadoService.actualizarHitoTresSemanas(this.consolidado.id, cumplido).subscribe({
      next: (data) => {
        this.consolidado = data;
        this.isUpdatingHito = false;
        this.notificationService.success(cumplido ? 'Hito de 3 semanas marcado' : 'Hito de 3 semanas desmarcado');
      },
      error: (error) => {
        this.isUpdatingHito = false;
        this.logger.httpError('consolidados.detail.update-milestone', error);
        this.notificationService.error(this.errorMapper.message(error, { fallback: 'No pudimos actualizar el hito de tres semanas.' }));
      }
    });
  }

  volver(): void {
    const destino = this.origen === 'atrasos' ? '/consolidados-atrasos' : '/consolidados';
    this.router.navigate([destino], {
      queryParams: this.origen === 'historico'
        ? { vista: 'historico', ...this.queryParamsRetorno }
        : this.queryParamsRetorno,
    });
  }

  puedeSerCerrado(): boolean {
    return this.isAdmin && !this.esTerminal();
  }

  puedeSerAsignado(): boolean {
    return this.isAdmin && !this.esTerminal();
  }

  asignar(): void {
    if (!this.consolidado || !this.puedeSerAsignado()) return;

    void this.router.navigate(['/consolidados', this.consolidado.id, 'asignar'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  mensajeWhatsApp(): string {
    if (!this.consolidado) return '';
    return institutionalWhatsAppMessage(
      this.consolidado.nombre,
      this.consolidado.usuarioAsignado || ''
    );
  }

  esTerminal(): boolean {
    return this.consolidado?.estado === 'GDC' || this.consolidado?.estado === 'CERRADO';
  }

  manejarTecladoModal(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.mostrarModalGDC ? this.cerrarModalGDC() : this.cerrarModalCierre();
      return;
    }

    if (event.key !== 'Tab') return;

    const dialog = this.modalDialog?.nativeElement;
    if (!dialog) return;

    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    if (focusables.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private guardarTrigger(event: Event): void {
    this.modalTrigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  }

  private enfocarModal(): void {
    setTimeout(() => {
      const dialog = this.modalDialog?.nativeElement;
      const autofocus = dialog?.querySelector<HTMLElement>('[autofocus]');
      (autofocus || dialog)?.focus();
    });
  }

  private restaurarFoco(): void {
    const trigger = this.modalTrigger;
    this.modalTrigger = null;
    setTimeout(() => trigger?.focus());
  }
}
