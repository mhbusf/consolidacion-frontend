import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoginComponent } from './login.component';

describe('LoginComponent redirection', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let component: LoginComponent;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'mustChangePassword', 'isAdmin', 'isMentor', 'login']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    auth.mustChangePassword.and.returnValue(false);
    auth.isAdmin.and.returnValue(false);
    auth.isMentor.and.returnValue(false);
    component = new LoginComponent(
      new FormBuilder(),
      auth,
      router,
      jasmine.createSpyObj<NotificationService>('NotificationService', ['success']),
    );
  });

  it('envía a un mentor a su portal', () => {
    auth.isMentor.and.returnValue(true);

    (component as unknown as { redirectUser: () => void }).redirectUser();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/encuentro-poder/mentor']);
  });

  it('mantiene dashboard como destino de administradores', () => {
    auth.isAdmin.and.returnValue(true);
    auth.isMentor.and.returnValue(true);

    (component as unknown as { redirectUser: () => void }).redirectUser();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/dashboard']);
  });
});
