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
          <a routerLink="/consolidados">
            <span class="brand-icon">📋</span>
            <span class="brand-text">Sistema de Consolidación</span>
          </a>
        </div>

        <ul class="nav-menu">
          <li *ngIf="isAdmin">
            <a routerLink="/dashboard" routerLinkActive="active">
              <span class="menu-icon">📊</span>
              Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/consolidados" routerLinkActive="active">
              <span class="menu-icon">👥</span>
              Consolidados
            </a>
          </li>
          <li *ngIf="isAdmin">
            <a routerLink="/usuarios" routerLinkActive="active">
              <span class="menu-icon">🔐</span>
              Usuarios
            </a>
          </li>
          <li *ngIf="isAdmin">
            <a routerLink="/usuarios/crear" routerLinkActive="active">
              <span class="menu-icon">➕</span>
              Crear Usuario
            </a>
          </li>
        </ul>

        <div class="nav-user" *ngIf="currentUser$ | async as user">
          <div class="dropdown">
            <button class="dropdown-toggle">
              <span class="user-icon">👤</span>
              <span class="user-name">{{ user.username }}</span>
              <span class="badge-role" *ngIf="isAdmin">ADMIN</span>
              <span class="dropdown-arrow">▼</span>
            </button>
            <div class="dropdown-menu">
              <a routerLink="/cambiar-password">
                <span class="menu-icon">🔑</span>
                Cambiar Contraseña
              </a>
              <a (click)="logout()" class="logout">
                <span class="menu-icon">🚪</span>
                Cerrar Sesión
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar {
        background: linear-gradient(135deg, #1e293b 0%, #1e3a8a 100%);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
        position: sticky;
        top: 0;
        z-index: 1000;
      }

      .nav-container {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 24px;
        min-height: 64px;
      }

      /* Brand */
      .nav-brand a {
        color: white;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.5px;
        transition: opacity 0.2s ease;
      }

      .nav-brand a:hover {
        opacity: 0.9;
      }

      .brand-icon {
        font-size: 24px;
      }

      .brand-text {
        display: inline-block;
      }

      /* Menu */
      .nav-menu {
        display: flex;
        list-style: none;
        margin: 0;
        padding: 0;
        gap: 4px;
        flex: 1;
        justify-content: center;
      }

      .nav-menu li {
        margin: 0;
      }

      .nav-menu a {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        padding: 10px 16px;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }

      .nav-menu a:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .nav-menu a.active {
        background: rgba(255, 255, 255, 0.15);
        color: white;
        font-weight: 600;
      }

      .menu-icon {
        font-size: 16px;
      }

      /* User Dropdown */
      .nav-user {
        position: relative;
      }

      .dropdown {
        position: relative;
      }

      .dropdown-toggle {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .dropdown-toggle:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }

      .user-icon {
        font-size: 16px;
      }

      .user-name {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .badge-role {
        background: #3b82f6;
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }

      .dropdown-arrow {
        font-size: 10px;
        transition: transform 0.2s ease;
      }

      .dropdown:hover .dropdown-arrow {
        transform: rotate(180deg);
      }

      .dropdown:hover .dropdown-menu {
        display: block;
      }

      .dropdown-menu {
        display: none;
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        background: #334155;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        min-width: 220px;
        z-index: 1000;
        border: 1px solid #475569;
        overflow: hidden;
      }

      .dropdown-menu a {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        color: #f1f5f9;
        text-decoration: none;
        transition: background 0.2s ease;
        font-size: 14px;
      }

      .dropdown-menu a:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .dropdown-menu a.logout {
        color: #ef4444;
        border-top: 1px solid #475569;
        cursor: pointer;
      }

      .dropdown-menu a.logout:hover {
        background: rgba(239, 68, 68, 0.1);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .nav-container {
          flex-wrap: wrap;
          padding: 12px 16px;
        }

        .brand-text {
          display: none;
        }

        .nav-menu {
          order: 3;
          width: 100%;
          margin-top: 12px;
          justify-content: flex-start;
          overflow-x: auto;
          gap: 8px;
        }

        .nav-menu a {
          flex-shrink: 0;
        }

        .user-name {
          display: none;
        }
      }
    `,
  ],
})
export class NavbarComponent implements OnInit {
  currentUser$: Observable<JwtResponse | null>;
  isAdmin = false;

  constructor(public authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.currentUser$.subscribe((user) => {
      this.isAdmin = this.authService.isAdmin();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
