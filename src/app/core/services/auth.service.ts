import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  LoginRequest,
  RegisterRequest,
  JwtResponse,
  User,
  ChangePasswordRequest,
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<JwtResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    let storedUser: string | null;
    try {
      storedUser = localStorage.getItem('currentUser');
    } catch {
      storedUser = null;
    }

    if (storedUser) {
      try {
        const parsedUser: unknown = JSON.parse(storedUser);
        if (!this.isJwtResponse(parsedUser) || this.isTokenExpired()) {
          this.logout();
        } else {
          const user = this.withTokenFlags(parsedUser);
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      } catch {
        // La sesión persistida no debe impedir que arranque la aplicación.
        this.logout();
      }
    }
  }

  register(request: RegisterRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/register`, request, {
      responseType: 'text',
    });
  }

  login(request: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        const user = this.withTokenFlags(response);
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    } catch {
      // El estado en memoria sigue siendo suficiente para cerrar la sesion.
    }
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    return true;
  }

  private isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(this.decodeTokenPart(token)) as { exp?: unknown };
      return typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  hasRole(roleName: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.roles.some((role) => role.name === roleName) || false;
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  mustChangePassword(): boolean {
    const user = this.currentUserSubject.value;
    if (typeof user?.mustChangePassword === 'boolean') {
      return user.mustChangePassword;
    }

    return this.getTokenFlag('mustChangePassword') === true;
  }

  markPasswordChanged(): void {
    const user = this.currentUserSubject.value;
    if (!user) return;

    const updatedUser = { ...user, mustChangePassword: false };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }

  refreshSessionWithNewPassword(newPassword: string): Observable<JwtResponse> {
    const username = this.currentUserSubject.value?.username;
    if (!username) {
      throw new Error('No hay usuario autenticado');
    }

    return this.login({ username, password: newPassword });
  }

  markPasswordChangeRequired(): void {
    const user = this.currentUserSubject.value;
    if (!user) return;

    const updatedUser = { ...user, mustChangePassword: true };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${encodeURIComponent(username)}`);
  }

  assignRole(username: string, roleName: string): Observable<string> {
    const params = new HttpParams().set('roleName', roleName);
    return this.http.put(
      `${this.apiUrl}/users/${encodeURIComponent(username)}/roles`,
      {},
      { params, responseType: 'text' }
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<string> {
    return this.http.put(`${this.apiUrl}/password`, request, {
      responseType: 'text',
    });
  }

  deleteUser(username: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/users/${encodeURIComponent(username)}`, {
      responseType: 'text',
    });
  }

  changeUserPassword(
    username: string,
    newPassword: string
  ): Observable<string> {
    return this.http.put(
      `${this.apiUrl}/users/${encodeURIComponent(username)}/password`,
      { newPassword },
      { responseType: 'text' }
    );
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      token,
      newPassword,
    });
  }

  private withTokenFlags(user: JwtResponse): JwtResponse {
    if (typeof user.mustChangePassword === 'boolean') {
      return user;
    }

    return {
      ...user,
      mustChangePassword: this.readTokenFlag(user.token, 'mustChangePassword') === true,
    };
  }

  private isJwtResponse(value: unknown): value is JwtResponse {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Partial<JwtResponse>;
    return typeof candidate.token === 'string'
      && typeof candidate.username === 'string'
      && Array.isArray(candidate.roles);
  }

  private getTokenFlag(flagName: string): boolean | null {
    const token = this.getToken();
    if (!token) return null;
    return this.readTokenFlag(token, flagName);
  }

  private readTokenFlag(token: string, flagName: string): boolean | null {
    try {
      const payload = JSON.parse(this.decodeTokenPart(token)) as Record<string, unknown>;
      return typeof payload[flagName] === 'boolean' ? payload[flagName] : null;
    } catch {
      return null;
    }
  }

  private decodeTokenPart(token: string): string {
    const part = token.split('.')[1];
    if (!part) throw new Error('Token JWT inválido');
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  }
}
