import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';
import { JwtResponse } from '../../../core/models/auth.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar" *ngIf="authService.isAuthenticated()">
      <div class="nav-container">
        <div class="nav-brand">
          <a routerLink="/consolidados">Sistema de Consolidación</a>
        </div>

        <ul class="nav-menu">
          <li *ngIf="isAdmin">
            <a routerLink="/dashboard" routerLinkActive="active">
              📊 Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/consolidados" routerLinkActive="active">
              Consolidados
            </a>
          </li>
          <li *ngIf="isAdmin">
            <a routerLink="/usuarios" routerLinkActive="active">
              Usuarios
            </a>
          </li>
          <li *ngIf="isAdmin">
            <a routerLink="/usuarios/crear" routerLinkActive="active">
              Crear Usuario
            </a>
          </li>
        </ul>

        <div class="nav-user" *ngIf="currentUser$ | async as user">
          <div class="dropdown">
            <button class="dropdown-toggle">
              {{ user.username }}
              <span class="badge-role" *ngIf="isAdmin">ADMIN</span>
            </button>
            <div class="dropdown-menu">
              <a routerLink="/cambiar-password">Cambiar Contraseña</a>
              <a (click)="logout()" class="logout">Cerrar Sesión</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: #343a40;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      height: 60px;
    }

    .nav-brand a {
      color: white;
      font-size: 20px;
      font-weight: bold;
      text-decoration: none;
    }

    .nav-menu {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 20px;
    }

    .nav-menu a {
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 4px;
      transition: all 0.3s;
    }

    .nav-menu a:hover,
    .nav-menu a.active {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .nav-user {
      position: relative;
    }

    .dropdown-toggle {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge-role {
      background: #28a745;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
    }

    .dropdown:hover .dropdown-menu {
      display: block;
    }

    .dropdown-menu {
      display: none;
      position: absolute;
      right: 0;
      top: 100%;
      margin-top: 5px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 200px;
      z-index: 1000;
    }

    .dropdown-menu a {
      display: block;
      padding: 10px 16px;
      color: #333;
      text-decoration: none;
      transition: background 0.2s;
    }

    .dropdown-menu a:hover {
      background: #f8f9fa;
    }

    .dropdown-menu a.logout {
      color: #dc3545;
      border-top: 1px solid #dee2e6;
      cursor: pointer;
    }
  `]
})
export class NavbarComponent implements OnInit {
  currentUser$: Observable<JwtResponse | null>;
  isAdmin = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.currentUser$.subscribe(user => {
      this.isAdmin = this.authService.isAdmin();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}