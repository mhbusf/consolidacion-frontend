import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CrearUsuarioComponent } from './crear-usuario.component';
import { RoleName } from '../../../core/models/auth.model';

describe('CrearUsuarioComponent roles', () => {
  let fixture: ComponentFixture<CrearUsuarioComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'register']);
    auth.isAdmin.and.returnValue(true);
    auth.register.and.returnValue(of(''));
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
});
