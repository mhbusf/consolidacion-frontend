import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComentarioRequest, ComentarioResponse } from '../models/comentario.model';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ComentarioService {
  private apiUrl = `${environment.apiUrl}/consolidados`;

  constructor(private http: HttpClient) {}

  agregar(consolidadoId: number, request: ComentarioRequest): Observable<ComentarioResponse> {
    return this.http.post<ComentarioResponse>(`${this.apiUrl}/${consolidadoId}/comentarios`, request);
  }

  listar(consolidadoId: number): Observable<ComentarioResponse[]> {
    return this.http.get<ComentarioResponse[]>(`${this.apiUrl}/${consolidadoId}/comentarios`);
  }
}