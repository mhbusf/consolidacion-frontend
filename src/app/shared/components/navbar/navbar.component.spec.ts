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
  });

  function userWithRole(role: string): JwtResponse {
    return {
      token: 'token',
      username: 'usuario',
      email: 'usuario@example.com',
      roles: [{ id: 1, name: role }],
      mustChangePassword: false,
    };
  }
});
