import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
// RUTAS CORREGIDAS (../ en lugar de ../../)
import { DashboardService } from '../core/services/dashboard.service';
import { ConsolidadoService } from '../core/services/consolidado.service';
import { Dashboard } from '../core/models/consolidado.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  dashboard?: Dashboard;
  loading = true;
  error = '';

  // === VARIABLES NUEVAS PARA EL MODAL ===
  showModal = false;
  modalTitle = '';
  modalList: any[] = [];
  loadingModal = false;

  constructor(
    private dashboardService: DashboardService,
    private consolidadoService: ConsolidadoService, // Inyectamos este servicio
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el dashboard';
        this.loading = false;
        console.error(err);
      },
    });
  }

  // === NUEVO: MÉTODO PARA ABRIR EL MODAL ===
  abrirModal(tipo: string): void {
    this.showModal = true;
    this.loadingModal = true;
    this.modalList = [];

    const titulos: { [key: string]: string } = {
      TOTAL: 'Listado Total de Consolidados',
      EN_PROCESO: 'Consolidados En Proceso',
      AL_DIA: 'Consolidados Al Día',
      ATRASADOS: 'Consolidados Con Atrasos',
      CON_GDC: 'Consolidados con GDC Asignado',
      CERRADO: 'Consolidados Cerrados',
    };
    this.modalTitle = titulos[tipo] || 'Detalle';

    // CASO 1: ATRASADOS (Usamos datos en memoria para rapidez)
    if (tipo === 'ATRASADOS' && this.dashboard?.consolidadosConAtrasos) {
      this.modalList = this.dashboard.consolidadosConAtrasos.map((c) => ({
        id: c.id,
        // Mapeamos 'titulo' a 'nombre' para que la tabla del modal lo entienda
        nombre: c.titulo,
        telefono: 'Ver detalle', // El resumen de atrasos no trae teléfono por defecto
        usuarioAsignado: c.asignadoA,
      }));
      this.loadingModal = false;
    }
    // CASO 2: LOS DEMÁS (Consultamos al backend para tener datos frescos y teléfonos)
    else {
      this.consolidadoService.filtrarPorTipo(tipo).subscribe({
        next: (data) => {
          this.modalList = data;
          this.loadingModal = false;
        },
        error: (err) => {
          console.error('Error al cargar lista detallada', err);
          this.loadingModal = false;
        },
      });
    }
  }

  // === NUEVO: CERRAR MODAL ===
  cerrarModal(): void {
    this.showModal = false;
  }

  verConsolidado(id: number): void {
    this.router.navigate(['/consolidados', id]);
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      PENDIENTE: 'badge-warning',
      ASIGNADO: 'badge-primary', // Cambiado a primary para que resalte
      EN_PROCESO: 'badge-info',
      GDC: 'badge-warning', // GDC suele ser un estado de atención
      CERRADO: 'badge-success', // Cerrado exitoso
    };
    return clases[estado] || 'badge-secondary';
  }

  getAtrasoClass(dias: number): string {
    if (dias === 0) return 'text-success'; // Si es 0 días, es verde/ok
    if (dias <= 2) return 'text-warning';
    return 'text-danger fw-bold';
  }
}
