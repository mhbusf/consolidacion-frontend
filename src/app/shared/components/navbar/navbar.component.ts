import { ChangeDetectionStrategy, Component, computed, HostListener, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (currentUser()) {
      <nav class="navbar">
        <div class="nav-container">
          <div class="nav-brand">
            <a [routerLink]="isMentorOnly() ? '/encuentro-poder/mentor' : '/consolidados'">
              <span class="brand-icon">{{ isMentorOnly() ? '⚡' : '📋' }}</span>
              <span class="brand-text">Sistema de Consolidación</span>
            </a>
          </div>
          <button class="mobile-menu-toggle" type="button" (click)="toggleMobileMenu($event)"
            [attr.aria-expanded]="mobileMenuOpen" [attr.aria-label]="mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'">
            <span></span>
            <span></span>
            <span></span>
           </button>
           <ul class="nav-menu" [class.mobile-open]="mobileMenuOpen">
             @if (isMentorOnly()) {
                <li>
                  <a routerLink="/encuentro-poder/mentor" routerLinkActive="active" (click)="closeMenus()">
                   <span class="menu-icon">👥</span>
                   Mis participantes
                  </a>
                </li>
                <li>
                  <a routerLink="/encuentro-poder/mentor/asistencia" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">✓</span>
                    Tomar asistencia
                  </a>
                </li>
               <li>
                 <a routerLink="/change-password" routerLinkActive="active" (click)="closeMenus()">
                   <span class="menu-icon">🔑</span>
                   Cambiar Contraseña
                 </a>
               </li>
             } @else {
              @if (isAdmin()) {
              <li>
                <a routerLink="/dashboard" routerLinkActive="active" (click)="closeMenus()">
                  <span class="menu-icon">📊</span>
                  Dashboard
                </a>
              </li>
            }
            <li class="nav-group" [class.open]="openGroup === 'consolidacion'" [class.active]="isRouteGroupActive(['/consolidados', '/consolidados-atrasos', '/estadisticas-gdc', '/reportes/consolidados'])">
              <button class="nav-group-toggle" type="button" (click)="toggleGroup('consolidacion', $event)"
                [attr.aria-expanded]="openGroup === 'consolidacion'" aria-controls="submenu-consolidacion">
                <span class="menu-icon">👥</span>
                Consolidación
                <span class="dropdown-arrow">▼</span>
              </button>
              <div class="nav-submenu" id="submenu-consolidacion">
                <a routerLink="/consolidados" routerLinkActive="active" (click)="closeMenus()">
                  <span class="menu-icon">👥</span>
                  Consolidados
                </a>
                @if (isAdmin()) {
                  <a routerLink="/consolidados-atrasos" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">⚠️</span>
                    Atrasos
                  </a>
                  <a routerLink="/estadisticas-gdc" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">📈</span>
                    Histórico de cierres
                  </a>
                  <a routerLink="/reportes/consolidados" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">📑</span>
                    Reportes consolidados
                  </a>
                }
              </div>
            </li>
            <li class="nav-group" [class.open]="openGroup === 'cafe'" [class.active]="isRouteGroupActive(['/cafe-con-jesus', '/cafe-admin', '/reportes/cafe-con-jesus'])">
              <button class="nav-group-toggle" type="button" (click)="toggleGroup('cafe', $event)"
                [attr.aria-expanded]="openGroup === 'cafe'" aria-controls="submenu-cafe">
                <span class="menu-icon">☕</span>
                Cafe con Jesus
                <span class="dropdown-arrow">▼</span>
              </button>
              <div class="nav-submenu" id="submenu-cafe">
                <a routerLink="/cafe-con-jesus" routerLinkActive="active" (click)="closeMenus()">
                  <span class="menu-icon">☕</span>
                  Invitados
                </a>
                @if (isAdmin()) {
                  <a routerLink="/cafe-admin" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">📋</span>
                    Admin Café
                  </a>
                  <a routerLink="/reportes/cafe-con-jesus" routerLinkActive="active" (click)="closeMenus()">
                    <span class="menu-icon">📑</span>
                    Reporte Café
                  </a>
                }
              </div>
            </li>
            @if (isMentor() || isSuperAdmin()) {
              <li class="nav-group" [class.open]="openGroup === 'encuentro'" [class.active]="isRouteGroupActive(['/encuentro-poder'])">
                <button class="nav-group-toggle" type="button" (click)="toggleGroup('encuentro', $event)"
                  [attr.aria-expanded]="openGroup === 'encuentro'" aria-controls="submenu-encuentro">
                  <span class="menu-icon">⚡</span>
                  Encuentro de Poder
                  <span class="dropdown-arrow">▼</span>
                </button>
                <div class="nav-submenu" id="submenu-encuentro">
                   @if (isSuperAdmin()) {
                     <a routerLink="/encuentro-poder" routerLinkActive="active" (click)="closeMenus()">
                       <span class="menu-icon">⚡</span>
                       Panel de Encuentro
                     </a>
                   }
                   <a routerLink="/encuentro-poder/mentor" routerLinkActive="active" (click)="closeMenus()">
                     <span class="menu-icon">👥</span>
                     Portal de mentoría
                   </a>
                   <a routerLink="/encuentro-poder/mentor/asistencia" routerLinkActive="active" (click)="closeMenus()">
                     <span class="menu-icon">✓</span>
                     Tomar asistencia
                   </a>
                </div>
              </li>
            }
            <li class="nav-group" [class.open]="openGroup === 'usuario'" [class.active]="isRouteGroupActive(['/usuarios', '/change-password'])">
              <button class="nav-group-toggle" type="button" (click)="toggleGroup('usuario', $event)"
                [attr.aria-expanded]="openGroup === 'usuario'" aria-controls="submenu-usuario">
                <span class="menu-icon">🔐</span>
                Usuario
                <span class="dropdown-arrow">▼</span>
              </button>
              <div class="nav-submenu" id="submenu-usuario">
                 @if (isAdmin()) {
                   <a routerLink="/usuarios" routerLinkActive="active" (click)="closeMenus()">
                     <span class="menu-icon">🔐</span>
                     Usuarios
                   </a>
                 }
                  @if (isAdmin()) {
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
             }
           </ul>
          @if (currentUser(); as user) {
            <div class="nav-user">
              <div class="dropdown" [class.open]="dropdownOpen">
                <button class="dropdown-toggle" type="button" (click)="toggleDropdown($event)"
                  [attr.aria-expanded]="dropdownOpen" aria-controls="user-menu">
                  <span class="user-icon">👤</span>
                  <span class="user-name">{{ user.username }}</span>
                   @if (isAdmin()) {
                     <span class="badge-role">ADMIN</span>
                   } @else if (isMentor()) {
                     <span class="badge-role mentor">MENTOR</span>
                  }
                  <span class="dropdown-arrow">▼</span>
                </button>
                @if (dropdownOpen) {
                  <div class="dropdown-menu" id="user-menu">
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .navbar {
        position: sticky;
        top: 0;
        z-index: 1000;
        background: rgba(8, 17, 31, 0.94);
        border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 18px 42px -34px rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(18px);
      }

      .nav-container {
        max-width: 1600px;
        margin: 0 auto;
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 0 28px;
      }

      /* Brand */
      .nav-brand a {
        color: white;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 17px;
        font-weight: 900;
        letter-spacing: -0.5px;
        transition: opacity 0.2s ease;
      }

      .nav-brand a:hover {
        opacity: 0.9;
      }

      .brand-icon {
        font-size: 22px;
        filter: grayscale(1);
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
        align-items: center;
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
        color: rgba(226, 232, 240, 0.84);
        text-decoration: none;
        padding: 10px 14px;
        border-radius: 12px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 14px;
        font-weight: 800;
        white-space: nowrap;
        border: 1px solid transparent;
      }

      .nav-group {
        position: relative;
      }

      .nav-group-toggle {
        color: rgba(226, 232, 240, 0.84);
        background: transparent;
        border: 1px solid transparent;
        text-decoration: none;
        padding: 10px 14px;
        border-radius: 12px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 14px;
        font-weight: 800;
        white-space: nowrap;
        cursor: pointer;
      }

      .nav-group-toggle:hover,
      .nav-group.active .nav-group-toggle,
      .nav-group.open .nav-group-toggle {
        background: rgba(96, 165, 250, 0.15);
        border-color: rgba(96, 165, 250, 0.24);
        color: white;
      }

      .nav-group-toggle:focus-visible,
      .nav-menu a:focus-visible,
      .dropdown-toggle:focus-visible,
      .mobile-menu-toggle:focus-visible {
        outline: 3px solid rgba(147, 197, 253, 0.9);
        outline-offset: 2px;
      }

      .nav-submenu {
        position: absolute;
        top: calc(100% + 10px);
        left: 0;
        min-width: 230px;
        margin: 0;
        background: #ffffff;
        border: 1px solid #dbe4ee;
        border-radius: 14px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-4px);
        transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
        z-index: 1000;
      }

      .nav-group:hover .nav-submenu,
      .nav-group.open .nav-submenu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .nav-group.open .dropdown-arrow {
        transform: rotate(180deg);
      }

      .nav-submenu a {
        border-radius: 0;
        margin: 0;
        padding: 12px 16px;
        color: #334155;
        font-size: 14px;
      }

      .nav-submenu a.active {
        background: #dbeafe;
        color: #1e40af;
      }

      .nav-menu > li > a:hover {
        background: rgba(96, 165, 250, 0.14);
        border-color: rgba(96, 165, 250, 0.24);
        color: white;
      }

      .nav-menu > li > a.active {
        background: rgba(96, 165, 250, 0.16);
        border-color: rgba(96, 165, 250, 0.24);
        color: white;
      }

      .nav-submenu a:hover,
      .nav-submenu a:focus-visible {
        background: #eff6ff;
        border-color: transparent;
        color: #1d4ed8;
      }

      .menu-icon {
        font-size: 16px;
        filter: grayscale(1);
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
        border-radius: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 800;
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

      .badge-role.mentor {
        background: linear-gradient(135deg, #0f766e, #2dd4bf);
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
        top: calc(100% + 10px);
        background: #ffffff;
        border-radius: 14px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
        min-width: 220px;
        z-index: 1000;
        border: 1px solid #dbe4ee;
        overflow: hidden;
      }

      .dropdown-menu a {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        color: #334155;
        text-decoration: none;
        transition: background 0.2s ease;
        font-size: 14px;
      }

      .dropdown-menu a:hover {
        background: #eff6ff;
      }

      .dropdown-menu a.logout {
        color: #dc2626;
        border-top: 1px solid #e2e8f0;
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

        .nav-group:hover .nav-submenu {
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
          margin-left: 8px;
        }

        .dropdown-toggle {
          width: auto;
        }

        .dropdown-menu {
          top: calc(100% + 8px);
        }
      }
    `,
  ],
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => event.urlAfterRedirects),
    startWith(this.router.url),
  ), { initialValue: this.router.url });
  readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  readonly isSuperAdmin = computed(() => this.currentUser()?.roles.some(role => role.name === 'ROLE_SUPER_ADMIN') ?? false);
  readonly isAdmin = computed(() => this.currentUser()?.roles.some(role =>
    role.name === 'ROLE_ADMIN' || role.name === 'ROLE_SUPER_ADMIN') ?? false);
  readonly isMentor = computed(() => this.currentUser()?.roles.some(role =>
    role.name === 'ROLE_MENTOR' || role.name === 'ROLE_SUPER_ADMIN') ?? false);
  readonly hasEffectiveUser = computed(() => this.currentUser()?.roles.some(role =>
    role.name === 'ROLE_USER' || role.name === 'ROLE_ADMIN' || role.name === 'ROLE_SUPER_ADMIN') ?? false);
  readonly isMentorOnly = computed(() => this.isMentor() && !this.hasEffectiveUser());
  dropdownOpen = false;
  openGroup: 'consolidacion' | 'cafe' | 'encuentro' | 'usuario' | null = null;
  mobileMenuOpen = false;

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

  toggleGroup(group: 'consolidacion' | 'cafe' | 'encuentro' | 'usuario', event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = false;
    this.openGroup = this.openGroup === group ? null : group;
  }

  closeMenus(): void {
    this.openGroup = null;
    this.dropdownOpen = false;
    this.mobileMenuOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeMenus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus();
  }

  logout(): void {
    this.closeMenus();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isRouteGroupActive(paths: string[]): boolean {
    const url = this.currentUrl();
    return paths.some(path => url === path || url.startsWith(`${path}/`));
  }
}
