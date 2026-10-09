import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  LoginRequest,
  RegisterRequest,
  JwtResponse,
  User,
  ChangePasswordRequest,
  RoleName,
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<JwtResponse | null>(null);
  private expirationTimer?: ReturnType<typeof setTimeout>;
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
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
          this.scheduleTokenExpiration(user.token);
        }
      } catch {
        // La sesión persistida no debe impedir que arranque la aplicación.
        this.logout();
      }
    }
  }

  register(request: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, request);
  }

  login(request: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        const user = this.withTokenFlags(response);
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(user);
        this.scheduleTokenExpiration(response.token);
      })
    );
  }

  logout(): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = undefined;
    }
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

  private scheduleTokenExpiration(token: string): void {
    if (this.expirationTimer) clearTimeout(this.expirationTimer);
    try {
      const payload = JSON.parse(this.decodeTokenPart(token)) as { exp?: unknown };
      const expiresAt = typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
      const delay = expiresAt - Date.now();
      if (delay <= 0) {
        this.logout();
        return;
      }
      this.expirationTimer = setTimeout(() => {
        this.logout();
        void this.router.navigate(['/login']);
      }, delay);
    } catch {
      this.logout();
    }
  }

  hasRole(roleName: string): boolean {
    const user = this.currentUserSubject.value;
    const roles = new Set(user?.roles.map(role => role.name) ?? []);
    if (roles.has(roleName)) return true;
    if (roles.has(RoleName.SUPER_ADMIN)) {
      return roleName === RoleName.ADMIN || roleName === RoleName.USER || roleName === RoleName.MENTOR;
    }
    return roleName === RoleName.USER && roles.has(RoleName.ADMIN);
  }

  isAdmin(): boolean {
    return this.hasRole(RoleName.ADMIN);
  }

  isSuperAdmin(): boolean {
    return this.hasRole(RoleName.SUPER_ADMIN);
  }

  isMentor(): boolean {
    return this.hasRole(RoleName.MENTOR);
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

  updateRoles(username: string, roleNames: RoleName[]): Observable<User> {
    return this.http.put<User>(
      `${this.apiUrl}/users/${encodeURIComponent(username)}/roles`,
      { roleNames },
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
