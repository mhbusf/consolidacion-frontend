import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { JwtResponse } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let currentUser: BehaviorSubject<JwtResponse | null>;

  beforeEach(async () => {
    currentUser = new BehaviorSubject<JwtResponse | null>(null);
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout'], {
      currentUser$: currentUser.asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
  });

  it('oculta Encuentro de Poder a un administrador comun', () => {
    currentUser.next(userWithRole('ROLE_ADMIN'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Encuentro de Poder');
  });

  it('muestra Encuentro y las opciones de administrador al superadministrador', () => {
    currentUser.next(userWithRole('ROLE_SUPER_ADMIN'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Encuentro de Poder');
    expect(fixture.nativeElement.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Dashboard de resultados');
    expect(fixture.nativeElement.textContent).toContain('Portal de mentoría');
    expect(fixture.nativeElement.textContent).toContain('Tomar asistencia');
  });

  it('mantiene accesibles el inicio y el cierre de sesión en el menú móvil', () => {
    currentUser.next(userWithRole('ROLE_SUPER_ADMIN'));
    fixture.detectChanges();
    const brand = fixture.nativeElement.querySelector('.nav-brand a') as HTMLAnchorElement;
    const userToggle = fixture.nativeElement.querySelector('.dropdown-toggle') as HTMLButtonElement;

    expect(brand.getAttribute('aria-label')).toContain('Ir al inicio');
    userToggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.logout').tagName).toBe('BUTTON');
  });

  it('abre el panel principal completo desde el control del menú móvil', () => {
    currentUser.next(userWithRole('ROLE_SUPER_ADMIN'));
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector('.mobile-menu-toggle') as HTMLButtonElement;
    const menu = fixture.nativeElement.querySelector('#main-navigation') as HTMLElement;

    expect(toggle.getAttribute('aria-controls')).toBe('main-navigation');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(menu.classList).not.toContain('mobile-open');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(menu.classList).toContain('mobile-open');
  });

  it('muestra al mentor independiente sus opciones de mentoría y cambio de contraseña', () => {
    currentUser.next(userWithRole('ROLE_MENTOR'));
    fixture.detectChanges();

    const text = fixture.nativeElement.querySelector('.nav-menu').textContent;
    expect(text).toContain('Mis participantes');
    expect(text).toContain('Tomar asistencia');
    expect(text).toContain('Cambiar Contraseña');
    expect(text).not.toContain('Consolidación');
    expect(text).not.toContain('Cafe con Jesus');
    expect(text).not.toContain('Dashboard');
    expect(text).not.toContain('Usuarios');
  });

  it('muestra módulos USER y mentoría a un usuario mentor combinado', () => {
    currentUser.next(userWithRoles('ROLE_USER', 'ROLE_MENTOR'));
    fixture.detectChanges();

    const text = fixture.nativeElement.querySelector('.nav-menu').textContent;
    expect(text).toContain('Consolidación');
    expect(text).toContain('Cafe con Jesus');
    expect(text).toContain('Portal de mentoría');
    expect(text).toContain('Tomar asistencia');
    expect(text).not.toContain('Panel de Encuentro');
    expect(text).not.toContain('Dashboard de resultados');
  });

  it('cierra el grupo desplegado con un segundo clic, clic exterior o Escape', () => {
    currentUser.next(userWithRole('ROLE_USER'));
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector('.nav-group-toggle') as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    document.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  function userWithRole(role: string): JwtResponse {
    return userWithRoles(role);
  }

  function userWithRoles(...roles: string[]): JwtResponse {
    return {
      token: 'token',
      username: 'usuario',
      email: 'usuario@example.com',
      roles: roles.map((name, index) => ({ id: index + 1, name })),
      mustChangePassword: false,
    };
  }
});
