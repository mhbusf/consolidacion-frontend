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
        background: rgba(11, 17, 32, 0.88);
        border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 18px 38px -28px rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(16px);
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
        padding: 0 28px;
        min-height: 72px;
      }

      /* Brand */
      .nav-brand a {
        color: white;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 17px;
        font-weight: 800;
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
        gap: 6px;
        flex: 1;
        justify-content: center;
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
        color: rgba(226, 232, 240, 0.82);
        text-decoration: none;
        padding: 10px 14px;
        border-radius: 10px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
      }

      .nav-group {
        position: relative;
      }

      .nav-group-toggle {
        color: rgba(226, 232, 240, 0.82);
        background: transparent;
        border: 0;
        text-decoration: none;
        padding: 10px 14px;
        border-radius: 10px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
      }

      .nav-group-toggle:hover,
      .nav-group.active .nav-group-toggle,
      .nav-group:focus-within .nav-group-toggle {
        background: rgba(96, 165, 250, 0.14);
        color: white;
      }

      .nav-submenu {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        min-width: 220px;
        background: #111827;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 14px;
        box-shadow: 0 24px 48px -24px rgba(0, 0, 0, 0.9);
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-4px);
        transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
        z-index: 1000;
      }

      .nav-group:hover .nav-submenu,
      .nav-group.open .nav-submenu,
      .nav-group:focus-within .nav-submenu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .nav-group.open .dropdown-arrow {
        transform: rotate(180deg);
      }

      .nav-submenu a {
        border-radius: 0;
        padding: 12px 16px;
        color: #e2e8f0;
      }

      .nav-submenu a.active {
        background: rgba(96, 165, 250, 0.18);
      }

      .nav-menu a:hover {
        background: rgba(96, 165, 250, 0.12);
        color: white;
      }

      .nav-menu a.active {
        background: rgba(96, 165, 250, 0.16);
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
        background: rgba(96, 165, 250, 0.12);
        border: 1px solid rgba(148, 163, 184, 0.24);
        color: white;
        padding: 9px 14px;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
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
        top: calc(100% + 8px);
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
        color: #ef4444;
        border-top: 1px solid rgba(148, 163, 184, 0.18);
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
          min-height: 64px;
        }

        .brand-text {
          display: none;
        }

        .mobile-menu-toggle {
          display: flex;
          margin-left: auto;
        }

        .nav-menu {
          order: 3;
          width: 100%;
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
          display: flex;
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
