import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { JwtResponse, RoleName, User } from '../models/auth.model';
import { AuthService } from './auth.service';

describe('AuthService roles', () => {
  let service: AuthService;

  afterEach(() => {
    service?.logout();
    localStorage.clear();
  });

  it('hace que SUPER_ADMIN herede ADMIN, USER y MENTOR', () => {
    service = serviceWithRole(RoleName.SUPER_ADMIN);

    expect(service.isSuperAdmin()).toBeTrue();
    expect(service.isAdmin()).toBeTrue();
    expect(service.hasRole(RoleName.USER)).toBeTrue();
    expect(service.hasRole(RoleName.MENTOR)).toBeTrue();
  });

  it('mantiene MENTOR independiente de USER y ADMIN', () => {
    service = serviceWithRole(RoleName.MENTOR);

    expect(service.isMentor()).toBeTrue();
    expect(service.hasRole(RoleName.USER)).toBeFalse();
    expect(service.isAdmin()).toBeFalse();
    expect(service.isSuperAdmin()).toBeFalse();
  });

  it('no concede MENTOR a un administrador comun', () => {
    service = serviceWithRole(RoleName.ADMIN);

    expect(service.isMentor()).toBeFalse();
  });

  it('no concede SUPER_ADMIN a un administrador comun', () => {
    service = serviceWithRole(RoleName.ADMIN);

    expect(service.isAdmin()).toBeTrue();
    expect(service.isSuperAdmin()).toBeFalse();
  });

  it('reemplaza los roles con un body atómico y retorna el usuario actualizado', () => {
    const http = jasmine.createSpyObj<HttpClient>('HttpClient', ['put']);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const updated: User = {
      id: 1,
      username: 'ana+mentor',
      email: 'ana@example.com',
      enabled: true,
      roles: [{ id: 1, name: RoleName.USER }, { id: 2, name: RoleName.MENTOR }],
    };
    http.put.and.returnValue(of(updated));
    service = new AuthService(http, router);

    let response: User | undefined;
    service.updateRoles('ana+mentor', [RoleName.USER, RoleName.MENTOR]).subscribe(user => response = user);

    expect(http.put).toHaveBeenCalledOnceWith(
      jasmine.stringMatching('/users/ana%2Bmentor/roles$'),
      { roleNames: [RoleName.USER, RoleName.MENTOR] },
    );
    expect(response).toEqual(updated);
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
