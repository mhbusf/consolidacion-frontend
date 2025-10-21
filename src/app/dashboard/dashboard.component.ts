import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../core/services/dashboard.service';
import { Dashboard } from '../core/models/consolidado.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  dashboard?: Dashboard;
  loading = true;
  error = '';

  constructor(
    private dashboardService: DashboardService,
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
      }
    });
  }

  verConsolidado(id: number): void {
    this.router.navigate(['/consolidados/detail', id]);
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'PENDIENTE': 'bg-warning',
      'ASIGNADO': 'bg-info',
      'EN_PROCESO': 'bg-primary',
      'GDC': 'bg-success',
      'CERRADO': 'bg-secondary'
    };
    return clases[estado] || 'bg-secondary';
  }

  getAtrasoClass(dias: number): string {
    if (dias === 0) return 'text-warning';
    if (dias <= 2) return 'text-warning';
    if (dias <= 5) return 'text-danger';
    return 'text-danger fw-bold';
  }
}