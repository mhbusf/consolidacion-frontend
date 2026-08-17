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

@Component({
  selector: 'app-consolidado-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consolidado-detail.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './consolidado-detail.component.css'
})
export class ConsolidadoDetailComponent implements OnInit {
  @ViewChild('modalDialog') modalDialog?: ElementRef<HTMLElement>;

  consolidado: ConsolidadoResponse | null = null;
  comentarios: ComentarioResponse[] = [];
  nuevoComentario = '';
  isLoading = true;
  isLoadingComentario = false;
  isUpdatingHito = false;
  isAdmin = false;
  origenHistorico = false;
  tipoHistorico = '';
  busquedaHistorico = '';
  fechaHistorico = '';

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
    private notificationService: NotificationService
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.origenHistorico = this.route.snapshot.queryParamMap.get('origen') === 'historico';
    this.tipoHistorico = this.route.snapshot.queryParamMap.get('tipo') || '';
    this.busquedaHistorico = this.route.snapshot.queryParamMap.get('busqueda') || '';
    this.fechaHistorico = this.route.snapshot.queryParamMap.get('fecha') || '';
    this.cargarDatos(id);
  }

  cargarDatos(id: number): void {
    this.isLoading = true;
    
    this.consolidadoService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.consolidado = data;
        this.cargarComentarios(id);
      },
      error: (error) => {
        console.error('Error al cargar consolidado', error);
        this.notificationService.error(error?.error?.message || 'No fue posible cargar el consolidado');
        this.isLoading = false;
        this.volver();
      }
    });
  }

  cargarComentarios(id: number): void {
    this.comentarioService.listar(id).subscribe({
      next: (data) => {
        this.comentarios = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar comentarios', error);
        this.isLoading = false;
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
        this.notificationService.error(error?.error?.message || 'Error al agregar comentario');
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
        // Recargar datos para ver el nuevo estado
        if (this.consolidado) {
          this.cargarDatos(this.consolidado.id);
        }
      },
      error: (error) => {
        this.notificationService.error(error?.error?.message || 'Error al cerrar con GDC');
        this.isClosing = false;
        console.error(error);
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
        this.router.navigate(['/consolidados']);
      },
      error: (error) => {
        this.isClosing = false;
        this.notificationService.error(error?.error?.message || 'Error al cerrar el consolidado');
        console.error(error);
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
        this.notificationService.error(error?.error?.message || 'Error al actualizar el hito de 3 semanas');
        console.error(error);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/consolidados'], {
      queryParams: this.origenHistorico ? {
        vista: 'historico',
        tipo: this.tipoHistorico || undefined,
        busqueda: this.busquedaHistorico || undefined,
        fecha: this.fechaHistorico || undefined,
      } : undefined,
    });
  }

  puedeSerCerrado(): boolean {
    return this.isAdmin && !this.esTerminal();
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
