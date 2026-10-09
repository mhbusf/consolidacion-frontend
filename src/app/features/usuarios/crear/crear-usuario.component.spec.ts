import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CrearUsuarioComponent } from './crear-usuario.component';
import { RoleName } from '../../../core/models/auth.model';

describe('CrearUsuarioComponent roles', () => {
  let fixture: ComponentFixture<CrearUsuarioComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let notifications: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'register']);
    auth.isAdmin.and.returnValue(true);
    auth.register.and.returnValue(of({
      id: 1,
      username: 'mentor1',
      email: 'mentor@example.com',
      nombre: 'Mentor',
      apellido: 'Uno',
      enabled: true,
      roles: [],
    }));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'warning', 'error']);
    await TestBed.configureTestingModule({
      imports: [CrearUsuarioComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CrearUsuarioComponent);
    fixture.detectChanges();
  });

  it('incluye checkboxes para todos los roles', () => {
    const labels = fixture.nativeElement.querySelector('.role-options').textContent;
    expect(labels).toContain('Usuario');
    expect(labels).toContain('Administrador');
    expect(labels).toContain('Mentor');
    expect(labels).toContain('Superadministrador');
  });

  it('crea los roles de forma atómica y normaliza dependencias', fakeAsync(() => {
    fixture.componentInstance.userForm.setValue({
      username: 'mentor1', nombre: 'Mentor', apellido: 'Uno', email: 'mentor@example.com',
      password: 'Segura1!',
    });
    fixture.componentInstance.toggleRole(RoleName.SUPER_ADMIN, { target: { checked: true } } as unknown as Event);
    fixture.componentInstance.toggleRole(RoleName.MENTOR, { target: { checked: true } } as unknown as Event);

    fixture.componentInstance.onSubmit();

    expect(auth.register).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      username: 'mentor1',
      roleNames: [RoleName.USER, RoleName.ADMIN, RoleName.MENTOR, RoleName.SUPER_ADMIN],
    }));
    tick(2000);
    expect(router.navigate).toHaveBeenCalledWith(['/usuarios']);
  }));

  it('muestra el mensaje enviado por el backend cuando falla el registro', () => {
    auth.register.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { message: 'Email ya registrado' },
    })));
    fixture.componentInstance.userForm.setValue({
      username: 'mentor1', nombre: 'Mentor', apellido: 'Uno', email: 'mentor@example.com',
      password: 'Segura1!',
    });
    fixture.componentInstance.toggleRole(RoleName.MENTOR, { target: { checked: true } } as unknown as Event);

    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.errorMessage).toBe('Email ya registrado');
    expect(notifications.error).toHaveBeenCalledOnceWith('Email ya registrado');
  });
});
