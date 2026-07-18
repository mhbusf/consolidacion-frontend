import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsolidadoResponse,
  ConsolidadoRequest,
} from '../models/consolidado.model';
import { environment } from '../../../environments/environment.prod';

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
    return this.http.put(
      `${this.apiUrl}/${id}/asignar?username=${username}`,
      {},
      { responseType: 'text' }
    );
  }

  actualizarHitoTresSemanas(id: number, cumplido: boolean): Observable<ConsolidadoResponse> {
    return this.http.put<ConsolidadoResponse>(
      `${this.apiUrl}/${id}/hito-tres-semanas?cumplido=${cumplido}`,
      {}
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
    return this.http.get<ConsolidadoResponse[]>(
      `${this.apiUrl}/filtrar?tipo=${tipo}`
    );
  }
}
