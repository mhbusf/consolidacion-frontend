import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { ComentarioService } from '../../../core/services/comentario.service';
import { ConsolidadoResponse } from '../../../core/models/consolidado.model';
import { ComentarioResponse } from '../../../core/models/comentario.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-consolidado-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <button class="btn-back" (click)="volver()">
        ← Volver
      </button>

      <div *ngIf="isLoading" class="loading">
        Cargando información...
      </div>

      <div *ngIf="!isLoading && consolidado">
        <div class="detail-card">
          <div class="card-header">
            <h2>{{ consolidado.nombre }}</h2>
            <span class="badge" *ngIf="consolidado.usuarioAsignado">
              Asignado a: {{ consolidado.usuarioAsignado }}
            </span>
            <span class="badge badge-warning" *ngIf="!consolidado.usuarioAsignado">
              Sin asignar
            </span>
          </div>

          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <strong>Teléfono:</strong>
                <span>{{ consolidado.telefono }}</span>
              </div>
              <div class="info-item">
                <strong>Edad:</strong>
                <span>{{ consolidado.edad }} años</span>
              </div>
              <div class="info-item">
                <strong>Invitado por:</strong>
                <span>{{ consolidado.quienInvito }}</span>
              </div>
              <div class="info-item">
                <strong>Reportado por:</strong>
                <span>{{ consolidado.usuarioReporta }}</span>
              </div>
            </div>

            <div class="info-section">
              <strong>Motivo de Oración:</strong>
              <p>{{ consolidado.motivoOracion }}</p>
            </div>
          </div>
        </div>

        <div class="comentarios-section">
          <h3>Comentarios y Seguimiento</h3>

          <div class="comentario-form">
            <textarea 
              [(ngModel)]="nuevoComentario"
              placeholder="Escribe un comentario de seguimiento..."
              rows="3"
              class="form-control"></textarea>
            <button 
              class="btn-primary" 
              (click)="agregarComentario()"
              [disabled]="!nuevoComentario.trim() || isLoadingComentario">
              {{ isLoadingComentario ? 'Guardando...' : 'Agregar Comentario' }}
            </button>
          </div>

          <div class="comentarios-list">
            <div class="empty-state" *ngIf="comentarios.length === 0">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </div>

            <div class="comentario" *ngFor="let com of comentarios">
              <div class="comentario-header">
                <strong>{{ com.usuario }}</strong>
                <span class="fecha">{{ com.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <p class="comentario-contenido">{{ com.contenido }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 40px auto;
      padding: 20px;
    }

    .btn-back {
      background: #6c757d;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 20px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .detail-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .card-header {
      background: #f8f9fa;
      padding: 20px;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .card-header h2 {
      margin: 0;
      flex: 1;
    }

    .badge {
      padding: 6px 12px;
      background: #28a745;
      color: white;
      border-radius: 4px;
      font-size: 14px;
    }

    .badge-warning {
      background: #ffc107;
      color: #333;
    }

    .card-body {
      padding: 30px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 25px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .info-item strong {
      color: #666;
      font-size: 14px;
    }

    .info-item span {
      color: #333;
      font-size: 16px;
    }

    .info-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
    }

    .info-section strong {
      display: block;
      margin-bottom: 10px;
      color: #666;
    }

    .info-section p {
      color: #333;
      line-height: 1.6;
    }

    .comentarios-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 30px;
    }

    .comentarios-section h3 {
      margin-top: 0;
      margin-bottom: 20px;
    }

    .comentario-form {
      margin-bottom: 30px;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      margin-bottom: 10px;
      box-sizing: border-box;
    }

    .btn-primary {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .comentarios-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #999;
      font-style: italic;
    }

    .comentario {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid #007bff;
    }

    .comentario-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .comentario-header strong {
      color: #007bff;
    }

    .fecha {
      color: #999;
      font-size: 13px;
    }

    .comentario-contenido {
      margin: 0;
      color: #555;
      line-height: 1.5;
    }
  `]
})
export class ConsolidadoDetailComponent implements OnInit {
  consolidado: ConsolidadoResponse | null = null;
  comentarios: ComentarioResponse[] = [];
  nuevoComentario = '';
  isLoading = true;
  isLoadingComentario = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consolidadoService: ConsolidadoService,
    private comentarioService: ComentarioService,
    private notificationService: NotificationService
  ) {}

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

  volver(): void {
    this.router.navigate(['/consolidados']);
  }
}