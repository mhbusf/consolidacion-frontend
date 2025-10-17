import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConsolidadoResponse, ConsolidadoRequest } from '../models/consolidado.model';

@Injectable({
  providedIn: 'root'
})
export class ConsolidadoService {
  private apiUrl = 'http://localhost:8080/api/consolidados';

  constructor(private http: HttpClient) {}

  crear(request: ConsolidadoRequest): Observable<ConsolidadoResponse> {
    return this.http.post<ConsolidadoResponse>(this.apiUrl, request);
  }

  obtenerTodos(): Observable<ConsolidadoResponse[]> {
    return this.http.get<ConsolidadoResponse[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<ConsolidadoResponse> {
    return this.http.get<ConsolidadoResponse>(`${this.apiUrl}/${id}`);
  }

  asignarUsuario(id: number, username: string): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/asignar?username=${username}`, {}, { responseType: 'text' });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}