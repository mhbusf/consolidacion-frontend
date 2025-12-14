import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
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
        localStorage.setItem('currentUser', JSON.stringify(response));
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(roleName: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.roles.some((role) => role.name === roleName) || false;
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${username}`);
  }

  assignRole(username: string, roleName: string): Observable<string> {
    return this.http.put(
      `${this.apiUrl}/users/${username}/roles?roleName=${roleName}`,
      {},
      { responseType: 'text' }
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<string> {
    return this.http.put(`${this.apiUrl}/password`, request, {
      responseType: 'text',
    });
  }

  deleteUser(username: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/users/${username}`, {
      responseType: 'text',
    });
  }

  changeUserPassword(
    username: string,
    newPassword: string
  ): Observable<string> {
    return this.http.put(
      `${this.apiUrl}/users/${username}/password?newPassword=${newPassword}`,
      {},
      { responseType: 'text' }
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      token,
      newPassword,
    });
  }
}
