import { Component, OnInit, HostListener, ElementRef, ChangeDetectionStrategy } from '@angular/core';
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
    @if (authService.isAuthenticated()) {
      <nav class="navbar">
        <div class="nav-container">
          <div class="nav-brand">
            <a routerLink="/consolidados">
              <span class="brand-icon">📋</span>
              <span class="brand-text">Sistema de Consolidación</span>
            </a>
          </div>
          <button class="mobile-menu-toggle" type="button" (click)="toggleMobileMenu($event)" aria-label="Abrir menú">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <ul class="nav-menu" [class.mobile-open]="mobileMenuOpen">
            @if (isAdmin) {
              <li>
                <a routerLink="/dashboard" routerLinkActive="active" (click)="closeMenus()">
                  <span class="menu-icon">📊</span>
                  Dashboard
                </a>
              </li>
            }
            <li class="nav-group" [class.open]="openGroup === 'consolidacion'" [class.active]="isRouteGroupActive(['/consolidados', '/consolidados-atrasos', '/estadisticas-gdc'])">
              <button class="nav-group-toggle" type="button" (click)="toggleGroup('consolidacion', $event)">
                <span class="menu-icon">👥</span>
                Consolidación
                <span class="dropdown-arrow">▼</span>
              </button>
              <div class="nav-submenu">
                <a routerLink="/consolidados" routerLinkActive="active" (click)="closeMenus()">
                  <span class="menu-icon">👥</span>
                  Consolidados
                </a>
                @if (isAdmin) {
                  <a routerLink="/consolidados-atrasos" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">⚠️</span>
                    Atrasos
                  </a>
                  <a routerLink="/estadisticas-gdc" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">📈</span>
                    Estadísticas GDC
                  </a>
                }
              </div>
            </li>
            <li class="nav-group" [class.open]="openGroup === 'cafe'" [class.active]="isRouteGroupActive(['/cafe-con-jesus', '/cafe-admin'])">
              <button class="nav-group-toggle" type="button" (click)="toggleGroup('cafe', $event)">
                <span class="menu-icon">☕</span>
                Cafe con Jesus
                <span class="dropdown-arrow">▼</span>
              </button>
              <div class="nav-submenu">
                <a routerLink="/cafe-con-jesus" routerLinkActive="active" (click)="closeMenus()">
                  <span class="menu-icon">☕</span>
                  Invitados
                </a>
                @if (isAdmin) {
                  <a routerLink="/cafe-admin" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">📋</span>
                    Admin Café
                  </a>
                }
              </div>
            </li>
            <li class="nav-group" [class.open]="openGroup === 'usuario'" [class.active]="isRouteGroupActive(['/usuarios', '/change-password'])">
              <button class="nav-group-toggle" type="button" (click)="toggleGroup('usuario', $event)">
                <span class="menu-icon">🔐</span>
                Usuario
                <span class="dropdown-arrow">▼</span>
              </button>
              <div class="nav-submenu">
                @if (isAdmin) {
                  <a routerLink="/usuarios" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">🔐</span>
                    Usuarios
                  </a>
                  <a routerLink="/usuarios/crear" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">➕</span>
                    Crear Usuario
                  </a>
                }
                <a routerLink="/change-password" routerLinkActive="active" (click)="closeMenus()">
                  <span class="menu-icon">🔑</span>
                  Cambiar Contraseña
                </a>
              </div>
            </li>
          </ul>
          @if (currentUser$ | async; as user) {
            <div class="nav-user">
              <div class="dropdown" [class.open]="dropdownOpen">
                <button class="dropdown-toggle" (click)="toggleDropdown($event)">
                  <span class="user-icon">👤</span>
                  <span class="user-name">{{ user.username }}</span>
                  @if (isAdmin) {
                    <span class="badge-role">ADMIN</span>
                  }
                  <span class="dropdown-arrow">▼</span>
                </button>
                @if (dropdownOpen) {
                  <div class="dropdown-menu">
                    <a (click)="logout()" class="logout">
                      <span class="menu-icon">🚪</span>
                      Cerrar Sesión
                    </a>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </nav>
    }
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .navbar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 280px;
        background: #08111f;
        border-right: 1px solid rgba(148, 163, 184, 0.12);
        box-shadow: none;
        color: white;
        z-index: 1000;
      }

      .nav-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        padding: 24px;
        min-height: 0;
      }

      /* Brand */
      .nav-brand a {
        color: white;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 19px;
        font-weight: 950;
        letter-spacing: -0.5px;
        transition: opacity 0.2s ease;
        margin-bottom: 30px;
      }

      .nav-brand a:hover {
        opacity: 0.9;
      }

      .brand-icon {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        font-size: 0;
        border: 2px solid #ffffff;
        border-radius: 999px 999px 12px 12px;
        transform: scaleX(0.84);
      }

      .brand-icon::before {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: transparent;
      }

      .brand-text {
        display: inline-block;
      }

      /* Menu */
      .nav-menu {
        display: grid;
        list-style: none;
        margin: 0;
        padding: 0;
        gap: 8px;
        flex: 1;
        justify-content: stretch;
        align-content: start;
      }

      .mobile-menu-toggle {
        display: none;
        width: 42px;
        height: 42px;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        background: rgba(96, 165, 250, 0.12);
        cursor: pointer;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 5px;
      }

      .mobile-menu-toggle span {
        display: block;
        width: 18px;
        height: 2px;
        border-radius: 999px;
        background: #e2e8f0;
      }

      .nav-menu li {
        margin: 0;
      }

      .nav-menu a {
        color: #c8d4e3;
        text-decoration: none;
        padding: 13px 14px;
        border-radius: 14px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 11px;
        font-size: 16px;
        font-weight: 850;
        white-space: nowrap;
        border: 1px solid transparent;
      }

      .nav-group {
        position: relative;
      }

      .nav-group-toggle {
        width: 100%;
        color: #c8d4e3;
        background: transparent;
        border: 1px solid transparent;
        text-decoration: none;
        padding: 13px 14px;
        border-radius: 14px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 11px;
        font-size: 16px;
        font-weight: 850;
        white-space: nowrap;
        cursor: pointer;
      }

      .nav-group-toggle:hover,
      .nav-group.active .nav-group-toggle,
      .nav-group:focus-within .nav-group-toggle {
        background: rgba(96, 165, 250, 0.15);
        border-color: rgba(96, 165, 250, 0.24);
        color: white;
      }

      .nav-submenu {
        position: static;
        min-width: 0;
        margin: 7px 0 4px 16px;
        background: rgba(15, 23, 42, 0.62);
        border: 1px solid rgba(148, 163, 184, 0.14);
        border-radius: 14px;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
        max-height: 0;
        transform: none;
        transition: opacity 0.2s ease, max-height 0.2s ease, visibility 0.2s ease;
        z-index: 1000;
      }

      .nav-group:hover .nav-submenu,
      .nav-group.open .nav-submenu,
      .nav-group:focus-within .nav-submenu {
        opacity: 1;
        visibility: visible;
        max-height: 340px;
      }

      .nav-group.open .dropdown-arrow {
        transform: rotate(180deg);
      }

      .nav-submenu a {
        border-radius: 10px;
        margin: 4px;
        padding: 11px 12px;
        color: #cbd5e1;
        font-size: 14px;
      }

      .nav-submenu a.active {
        background: rgba(96, 165, 250, 0.18);
      }

      .nav-menu a:hover {
        background: rgba(96, 165, 250, 0.15);
        border-color: rgba(96, 165, 250, 0.24);
        color: white;
      }

      .nav-menu a.active {
        background: rgba(96, 165, 250, 0.15);
        border-color: rgba(96, 165, 250, 0.24);
        color: white;
        font-weight: 900;
      }

      .menu-icon {
        min-width: 20px;
        font-size: 18px;
        filter: grayscale(1);
      }

      /* User Dropdown */
      .nav-user {
        position: relative;
        margin-top: 18px;
      }

      .dropdown {
        position: relative;
      }

      .dropdown-toggle {
        width: 100%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(148, 163, 184, 0.18);
        color: white;
        padding: 12px 14px;
        border-radius: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 900;
        transition: all 0.2s ease;
      }

      .dropdown-toggle:hover {
        background: rgba(96, 165, 250, 0.18);
        border-color: rgba(96, 165, 250, 0.38);
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
        background: linear-gradient(135deg, #2563eb, #60a5fa);
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

      .dropdown.open .dropdown-arrow {
        transform: rotate(180deg);
      }

      .dropdown-menu {
        position: absolute;
        right: 0;
        bottom: calc(100% + 8px);
        top: auto;
        background: #111827;
        border-radius: 14px;
        box-shadow: 0 24px 48px -24px rgba(0, 0, 0, 0.9);
        min-width: 220px;
        z-index: 1000;
        border: 1px solid rgba(148, 163, 184, 0.22);
        overflow: hidden;
      }

      .dropdown-menu a {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        color: #e2e8f0;
        text-decoration: none;
        transition: background 0.2s ease;
        font-size: 14px;
      }

      .dropdown-menu a:hover {
        background: rgba(96, 165, 250, 0.12);
      }

      .dropdown-menu a.logout {
        color: #fecaca;
        border-top: 1px solid rgba(148, 163, 184, 0.18);
        cursor: pointer;
      }

      .dropdown-menu a.logout:hover {
        background: rgba(239, 68, 68, 0.1);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .navbar {
          right: 0;
          bottom: auto;
          width: auto;
          min-height: 70px;
          border-right: 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        .nav-container {
          height: auto;
          flex-flow: row wrap;
          align-items: center;
          padding: 12px 16px;
          min-height: 64px;
        }

        .nav-brand a {
          margin-bottom: 0;
        }

        .brand-text {
          display: inline-block;
          font-size: 16px;
        }

        .mobile-menu-toggle {
          display: flex;
          margin-left: auto;
        }

        .nav-menu {
          order: 3;
          width: 100%;
          flex: 0 0 100%;
          margin-top: 12px;
          justify-content: flex-start;
          overflow: visible;
          gap: 8px;
          display: none;
          flex-direction: column;
          background: rgba(17, 24, 39, 0.96);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 16px;
          padding: 10px;
        }

        .nav-menu.mobile-open {
          display: grid;
        }

        .nav-menu a {
          flex-shrink: 0;
          width: 100%;
          justify-content: flex-start;
        }

        .nav-group {
          flex-shrink: 0;
          width: 100%;
        }

        .nav-group-toggle {
          width: 100%;
          justify-content: space-between;
        }

        .nav-submenu {
          position: static;
          min-width: 0;
          width: 100%;
          margin-top: 6px;
          box-shadow: none;
          border-radius: 12px;
          display: none;
          max-height: none;
          opacity: 1;
          visibility: visible;
          transform: none;
          overflow: hidden;
          border-width: 1px;
          transition: none;
        }

        .nav-group:hover .nav-submenu,
        .nav-group:focus-within .nav-submenu {
          display: none;
          transform: none;
        }

        .nav-group.open > .nav-submenu {
          display: block !important;
        }

        .nav-submenu a {
          padding: 12px 14px;
        }

        .user-name {
          display: none;
        }

        .nav-user {
          margin-top: 0;
          margin-left: 8px;
        }

        .dropdown-toggle {
          width: auto;
        }

        .dropdown-menu {
          top: calc(100% + 8px);
          bottom: auto;
        }
      }

      @media (max-width: 520px) {
        .brand-text {
          display: none;
        }
      }
    `,
  ],
})
export class NavbarComponent implements OnInit {
  currentUser$: Observable<JwtResponse | null>;
  isAdmin = false;
  dropdownOpen = false;
  openGroup: 'consolidacion' | 'cafe' | 'usuario' | null = null;
  mobileMenuOpen = false;

  constructor(public authService: AuthService, private router: Router, private el: ElementRef) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.currentUser$.subscribe(() => {
      this.isAdmin = this.authService.isAdmin();
    });
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.openGroup = null;
    this.mobileMenuOpen = false;
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleMobileMenu(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = false;
    this.openGroup = null;
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleGroup(group: 'consolidacion' | 'cafe' | 'usuario', event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = false;
    this.openGroup = this.openGroup === group ? null : group;
  }

  closeMenus(): void {
    this.openGroup = null;
    this.dropdownOpen = false;
    this.mobileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeMenus();
    }
  }

  logout(): void {
    this.closeMenus();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isRouteGroupActive(paths: string[]): boolean {
    return paths.some(path => this.router.url === path || this.router.url.startsWith(`${path}/`));
  }
}
