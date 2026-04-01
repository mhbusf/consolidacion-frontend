import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface CafeConJesusRequest {
  nombre: string;
  apellido: string;
  telefono: string;
  invitadoPor?: string;
}

export interface CafeConJesusResponse {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  invitadoPor: string;
  fechaIngreso: string;
  registradoPor: string;
  fechaCreacion: string;
}

@Injectable({
  providedIn: 'root',
})
export class CafeConJesusService {
  private apiUrl = `${environment.apiUrl}/cafe-con-jesus`;

  constructor(private http: HttpClient) {}

  crear(request: CafeConJesusRequest): Observable<CafeConJesusResponse> {
    return this.http.post<CafeConJesusResponse>(this.apiUrl, request);
  }

  listarTodos(): Observable<CafeConJesusResponse[]> {
    return this.http.get<CafeConJesusResponse[]>(this.apiUrl);
  }

  listarMios(): Observable<CafeConJesusResponse[]> {
    return this.http.get<CafeConJesusResponse[]>(`${this.apiUrl}/mis-registros`);
  }
}
