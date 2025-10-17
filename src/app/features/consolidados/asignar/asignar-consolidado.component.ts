import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-asignar-consolidado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h2>Asignar Consolidado</h2>

      <div class="card">
        <p><strong>ID del Consolidado:</strong> {{ consolidadoId }}</p>

        <div class="form-group">
          <label for="usuario">Seleccionar Usuario:</label>
          <select id="usuario" [(ngModel)]="usuarioSeleccionado" class="form-control">
            <option value="">-- Seleccione un usuario --</option>
            <option *ngFor="let user of usuarios" [value]="user.username">
              {{ user.username }} ({{ user.email }})
            </option>
          </select>
        </div>

        <div class="actions">
          <button class="btn-secondary" (click)="cancelar()">Cancelar</button>
          <button 
            class="btn-primary" 
            (click)="asignar()"
            [disabled]="!usuarioSeleccionado || isLoading">
            {{ isLoading ? 'Asignando...' : 'Asignar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
    }

    .card {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .form-group {
      margin: 20px 0;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #555;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 30px;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class AsignarConsolidadoComponent implements OnInit {
  consolidadoId!: number;
  usuarios: User[] = [];
  usuarioSeleccionado = '';
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consolidadoService: ConsolidadoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.consolidadoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.usuarios = users.filter(u => 
          u.roles.some(r => r.name === 'ROLE_USER')
        );
      },
      error: (error) => {
        console.error('Error al cargar usuarios', error);
      }
    });
  }

  asignar(): void {
    if (!this.usuarioSeleccionado) return;

    this.isLoading = true;
    this.consolidadoService.asignarUsuario(this.consolidadoId, this.usuarioSeleccionado).subscribe({
      next: () => {
        alert('Consolidado asignado correctamente');
        this.router.navigate(['/consolidados']);
      },
      error: (error) => {
        alert('Error al asignar');
        this.isLoading = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/consolidados']);
  }
}