import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CrearUsuarioComponent } from './crear-usuario.component';

describe('CrearUsuarioComponent roles', () => {
  let fixture: ComponentFixture<CrearUsuarioComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'isSuperAdmin', 'register', 'assignRole']);
    auth.isAdmin.and.returnValue(true);
    auth.isSuperAdmin.and.returnValue(true);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [CrearUsuarioComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'warning', 'error']) },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CrearUsuarioComponent);
    fixture.detectChanges();
  });

  it('incluye Mentor entre los perfiles disponibles', () => {
    const options = Array.from(fixture.nativeElement.querySelectorAll('#role option')) as HTMLOptionElement[];
    expect(options.some(option => option.value === 'ROLE_MENTOR' && option.textContent?.trim() === 'Mentor')).toBeTrue();
  });

  it('impide a un administrador común crear un perfil mentor', () => {
    auth.isSuperAdmin.and.returnValue(false);
    fixture.componentInstance.userForm.setValue({
      username: 'mentor1', nombre: 'Mentor', apellido: 'Uno', email: 'mentor@example.com',
      password: 'Segura1!', role: 'ROLE_MENTOR',
    });

    fixture.componentInstance.onSubmit();

    expect(auth.register).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
