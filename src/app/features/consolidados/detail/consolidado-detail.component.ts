import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { ComentarioService } from '../../../core/services/comentario.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConsolidadoResponse } from '../../../core/models/consolidado.model';
import { ComentarioResponse } from '../../../core/models/comentario.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-consolidado-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consolidado-detail.component.html',
  styleUrl: './consolidado-detail.component.css'
})
export class ConsolidadoDetailComponent implements OnInit {
  consolidado: ConsolidadoResponse | null = null;
  comentarios: ComentarioResponse[] = [];
  nuevoComentario = '';
  isLoading = true;
  isLoadingComentario = false;
  isAdmin = false;

  // Modal de cierre con GDC
  mostrarModalGDC = false;
  gdcNumero = '';
  comentarioCierre = '';
  isClosing = false;

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
        this.isLoading = false;
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
    if (!this.consolidado || !this.nuevoComentario.trim()) {
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
        this.notificationService.error('Error al agregar comentario');
        this.isLoadingComentario = false;
      }
    });
  }

  abrirModalGDC(): void {
    this.mostrarModalGDC = true;
    this.gdcNumero = '';
    this.comentarioCierre = '';
  }

  cerrarModalGDC(): void {
    this.mostrarModalGDC = false;
    this.gdcNumero = '';
    this.comentarioCierre = '';
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
        this.notificationService.error('Error al cerrar con GDC');
        this.isClosing = false;
        console.error(error);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/consolidados']);
  }

  puedeSerCerrado(): boolean {
    return this.isAdmin && 
           this.consolidado?.estado !== 'GDC' && 
           this.consolidado?.estado !== 'CERRADO';
  }
}