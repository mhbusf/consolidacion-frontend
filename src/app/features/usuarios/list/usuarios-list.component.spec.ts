import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UsuariosListComponent } from './usuarios-list.component';
import { RoleName, User } from '../../../core/models/auth.model';

describe('UsuariosListComponent permisos', () => {
  let fixture: ComponentFixture<UsuariosListComponent>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAdmin', 'isSuperAdmin', 'getAllUsers', 'updateRoles', 'changeUserPassword', 'deleteUser',
    ]);
    auth.isAdmin.and.returnValue(true);
    auth.isSuperAdmin.and.returnValue(false);
    auth.getAllUsers.and.returnValue(of([{
      id: 1,
      username: 'usuario',
      email: 'usuario@example.com',
      enabled: true,
      roles: [{ id: 1, name: 'ROLE_USER' }, { id: 2, name: 'ROLE_ADMIN' }],
    }]));
    const consolidado = jasmine.createSpyObj<ConsolidadoService>('ConsolidadoService', ['obtenerTodos']);
    consolidado.obtenerTodos.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [UsuariosListComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ConsolidadoService, useValue: consolidado },
        { provide: NotificationService, useValue: jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'warning', 'error']) },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UsuariosListComponent);
    fixture.detectChanges();
  });

  it('permite que un ADMIN edite y guarde el conjunto completo de roles', () => {
    expect(fixture.nativeElement.querySelector('.action-buttons')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.role-editor')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.persisted-roles').textContent).toContain('ADMIN');

    const user = fixture.componentInstance.usuarios[0];
    fixture.componentInstance.toggleUserRole(user, RoleName.SUPER_ADMIN, { target: { checked: true } } as unknown as Event);
    fixture.componentInstance.toggleUserRole(user, RoleName.MENTOR, { target: { checked: true } } as unknown as Event);
    const updated: User = {
      ...user,
      roles: [
        { id: 1, name: RoleName.USER }, { id: 2, name: RoleName.ADMIN },
        { id: 3, name: RoleName.MENTOR }, { id: 4, name: RoleName.SUPER_ADMIN },
      ],
    };
    auth.updateRoles.and.returnValue(of(updated));

    fixture.componentInstance.guardarRoles(user);

    expect(auth.updateRoles).toHaveBeenCalledOnceWith('usuario', [
      RoleName.USER, RoleName.ADMIN, RoleName.MENTOR, RoleName.SUPER_ADMIN,
    ]);
  });
});
