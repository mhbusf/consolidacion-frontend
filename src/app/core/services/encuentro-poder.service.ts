import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EncuentroAsistencia, EncuentroCiclo, EncuentroDashboard, EncuentroInscripcion,
  EncuentroParticipante, EncuentroPersona,
} from '../models/encuentro-poder.model';

@Injectable({ providedIn: 'root' })
export class EncuentroPoderService {
  private readonly api = `${environment.apiUrl}/encuentro-poder`;
  private readonly publicApi = `${environment.apiUrl}/public/encuentro-poder`;

  constructor(private http: HttpClient) {}

  ciclos(): Observable<EncuentroCiclo[]> { return this.http.get<EncuentroCiclo[]>(`${this.api}/ciclos`); }
  dashboard(cicloId: number): Observable<EncuentroDashboard> { return this.http.get<EncuentroDashboard>(`${this.api}/dashboard`, { params: { cicloId } }); }
  inscritos(cicloId: number): Observable<EncuentroInscripcion[]> { return this.http.get<EncuentroInscripcion[]>(`${this.api}/ciclos/${cicloId}/inscritos`); }
  buscarPersonas(texto: string): Observable<EncuentroPersona[]> { return this.http.get<EncuentroPersona[]>(`${this.api}/personas`, { params: { texto } }); }
  historial(id: number): Observable<EncuentroParticipante> { return this.http.get<EncuentroParticipante>(`${this.api}/personas/${id}/historial`); }
  registrarAsistencia(personaId: number, claseId: number): Observable<EncuentroAsistencia> { return this.http.post<EncuentroAsistencia>(`${this.api}/asistencias`, { personaId, claseId }); }
  crearCiclo(request: { nombre: string; fechaInicio: string; clase0?: string; clase1: string; clase2: string; clase3: string }): Observable<EncuentroCiclo> { return this.http.post<EncuentroCiclo>(`${this.api}/ciclos`, request); }
  cerrarCiclo(id: number): Observable<void> { return this.http.put<void>(`${this.api}/ciclos/${id}/cerrar`, null); }
  inscribir(token: string, request: { nombreCompleto: string; telefono: string; comuna?: string; invitadoPor?: string; tiempoCatedral?: string }): Observable<EncuentroInscripcion> { return this.http.post<EncuentroInscripcion>(`${this.publicApi}/${token}/inscripciones`, request); }
  exportar(cicloId: number): Observable<Blob> { return this.http.get(`${this.api}/ciclos/${cicloId}/exportar`, { responseType: 'blob' }); }
  importar(cicloId: number, archivo: File): Observable<unknown> { const body = new FormData(); body.append('archivo', archivo); return this.http.post(`${this.api}/ciclos/${cicloId}/importar`, body); }
  urlExportacion(cicloId: number): string { return `${this.api}/ciclos/${cicloId}/exportar`; }
}
