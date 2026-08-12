import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsolidadoResponse,
  ConsolidadoRequest,
} from '../models/consolidado.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConsolidadoService {
  private apiUrl = `${environment.apiUrl}/consolidados`;

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
    const params = new HttpParams().set('username', username);
    return this.http.put(
      `${this.apiUrl}/${id}/asignar`,
      {},
      { params, responseType: 'text' }
    );
  }

  actualizarHitoTresSemanas(id: number, cumplido: boolean): Observable<ConsolidadoResponse> {
    const params = new HttpParams().set('cumplido', cumplido);
    return this.http.put<ConsolidadoResponse>(
      `${this.apiUrl}/${id}/hito-tres-semanas`,
      {},
      { params }
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerCerradosGDC(): Observable<ConsolidadoResponse[]> {
    return this.http.get<ConsolidadoResponse[]>(`${this.apiUrl}/cerrados-gdc`);
  }

  // NUEVO MÉTODO PARA EL DASHBOARD INTERACTIVO
  filtrarPorTipo(tipo: string): Observable<ConsolidadoResponse[]> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<ConsolidadoResponse[]>(`${this.apiUrl}/filtrar`, { params });
  }
}
