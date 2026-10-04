import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UsuariosListComponent } from './usuarios-list.component';

describe('UsuariosListComponent permisos', () => {
  let fixture: ComponentFixture<UsuariosListComponent>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAdmin', 'isSuperAdmin', 'getAllUsers', 'assignRole', 'changeUserPassword', 'deleteUser',
    ]);
    auth.isAdmin.and.returnValue(true);
    auth.isSuperAdmin.and.returnValue(false);
    auth.getAllUsers.and.returnValue(of([{
      id: 1,
      username: 'usuario',
      email: 'usuario@example.com',
      enabled: true,
      roles: [{ id: 1, name: 'ROLE_USER' }],
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

  it('mantiene controles normales pero oculta promociones privilegiadas a un ADMIN común', () => {
    expect(fixture.nativeElement.querySelector('.action-buttons')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Mentor');
    expect(fixture.nativeElement.textContent).not.toContain('Super Admin');

    fixture.componentInstance.asignarPerfil('usuario', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN');

    expect(auth.assignRole).not.toHaveBeenCalled();
  });
});
