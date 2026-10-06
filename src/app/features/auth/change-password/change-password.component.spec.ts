import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { RoleName } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { ChangePasswordComponent } from './change-password.component';

describe('ChangePasswordComponent navigation', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let component: ChangePasswordComponent;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['mustChangePassword', 'isMentor', 'hasRole']);
    auth.mustChangePassword.and.returnValue(false);
    auth.isMentor.and.returnValue(false);
    auth.hasRole.and.returnValue(false);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    component = new ChangePasswordComponent(new FormBuilder(), auth, router);
  });

  it('vuelve al portal para un mentor independiente', () => {
    auth.isMentor.and.returnValue(true);
    component.cancelar();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/encuentro-poder/mentor']);
  });

  it('vuelve a Consolidación para un usuario mentor', () => {
    auth.isMentor.and.returnValue(true);
    auth.hasRole.withArgs(RoleName.USER).and.returnValue(true);
    component.cancelar();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/consolidados']);
  });
});
