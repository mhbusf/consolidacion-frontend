import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CrearUsuarioComponent } from './crear-usuario.component';

describe('CrearUsuarioComponent roles', () => {
  let fixture: ComponentFixture<CrearUsuarioComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'register', 'assignRole']);
    auth.isAdmin.and.returnValue(true);
    auth.register.and.returnValue(of(''));
    auth.assignRole.and.returnValue(of(''));
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

  it('incluye Mentor y Superadministrador para un ADMIN', () => {
    const options = Array.from(fixture.nativeElement.querySelectorAll('#role option')) as HTMLOptionElement[];
    expect(options.some(option => option.value === 'ROLE_MENTOR' && option.textContent?.trim() === 'Mentor')).toBeTrue();
    expect(options.some(option => option.value === 'ROLE_SUPER_ADMIN' && option.textContent?.trim() === 'Superadministrador')).toBeTrue();
  });

  it('permite a un ADMIN crear un perfil mentor', fakeAsync(() => {
    fixture.componentInstance.userForm.setValue({
      username: 'mentor1', nombre: 'Mentor', apellido: 'Uno', email: 'mentor@example.com',
      password: 'Segura1!', role: 'ROLE_MENTOR',
    });

    fixture.componentInstance.onSubmit();

    expect(auth.register).toHaveBeenCalled();
    expect(auth.assignRole).toHaveBeenCalledWith('mentor1', 'ROLE_MENTOR');
    tick(2000);
    expect(router.navigate).toHaveBeenCalledWith(['/usuarios']);
  }));
});
