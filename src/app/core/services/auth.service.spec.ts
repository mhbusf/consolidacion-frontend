import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtResponse, RoleName } from '../models/auth.model';
import { AuthService } from './auth.service';

describe('AuthService roles', () => {
  let service: AuthService;

  afterEach(() => {
    service?.logout();
    localStorage.clear();
  });

  it('hace que SUPER_ADMIN herede ADMIN y USER', () => {
    service = serviceWithRole(RoleName.SUPER_ADMIN);

    expect(service.isSuperAdmin()).toBeTrue();
    expect(service.isAdmin()).toBeTrue();
    expect(service.hasRole(RoleName.USER)).toBeTrue();
  });

  it('no concede SUPER_ADMIN a un administrador comun', () => {
    service = serviceWithRole(RoleName.ADMIN);

    expect(service.isAdmin()).toBeTrue();
    expect(service.isSuperAdmin()).toBeFalse();
  });

  function serviceWithRole(role: RoleName): AuthService {
    const token = tokenWithFutureExpiration();
    const user: JwtResponse = {
      token,
      username: 'usuario',
      email: 'usuario@example.com',
      roles: [{ id: 1, name: role }],
      mustChangePassword: false,
    };
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));

    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    return new AuthService({} as HttpClient, router);
  }

  function tokenWithFutureExpiration(): string {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 }));
    return `header.${payload}.signature`;
  }
});
