import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EncuentroAsistencia, EncuentroCiclo, EncuentroDashboard, EncuentroInscripcion,
  EncuentroParticipante, EncuentroPersona, EncuentroAsistenciaPublica,
} from '../models/encuentro-poder.model';

@Injectable({ providedIn: 'root' })
export class EncuentroPoderService {
  private readonly api = `${environment.apiUrl}/encuentro-poder`;
  private readonly publicApi = `${environment.apiUrl}/public/encuentro-poder`;
  private ciclosCache$?: Observable<EncuentroCiclo[]>;

  constructor(private http: HttpClient) {}

  ciclos(): Observable<EncuentroCiclo[]> {
    this.ciclosCache$ ??= this.http.get<EncuentroCiclo[]>(`${this.api}/ciclos`).pipe(
      catchError(error => { this.ciclosCache$ = undefined; return throwError(() => error); }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.ciclosCache$;
  }
  dashboard(cicloId: number): Observable<EncuentroDashboard> { return this.http.get<EncuentroDashboard>(`${this.api}/dashboard`, { params: { cicloId } }); }
  inscritos(cicloId: number): Observable<EncuentroInscripcion[]> { return this.http.get<EncuentroInscripcion[]>(`${this.api}/ciclos/${cicloId}/inscritos`); }
  buscarPersonas(texto: string): Observable<EncuentroPersona[]> { return this.http.get<EncuentroPersona[]>(`${this.api}/personas`, { params: { texto } }); }
  historial(id: number): Observable<EncuentroParticipante> { return this.http.get<EncuentroParticipante>(`${this.api}/personas/${id}/historial`); }
  registrarAsistencia(personaId: number, claseId: number): Observable<EncuentroAsistencia> { return this.http.post<EncuentroAsistencia>(`${this.api}/asistencias`, { personaId, claseId }); }
  crearCiclo(request: { nombre: string; fechaInicio: string; clase0?: string; clase1: string; clase2: string; clase3: string }): Observable<EncuentroCiclo> { return this.http.post<EncuentroCiclo>(`${this.api}/ciclos`, request).pipe(tap(() => this.ciclosCache$ = undefined)); }
  cerrarCiclo(id: number): Observable<void> { return this.http.put<void>(`${this.api}/ciclos/${id}/cerrar`, null).pipe(tap(() => this.ciclosCache$ = undefined)); }
  inscribir(token: string, request: { nombreCompleto: string; telefono: string; comuna?: string; invitadoPor?: string; tiempoCatedral?: string }): Observable<EncuentroInscripcion> { return this.http.post<EncuentroInscripcion>(`${this.publicApi}/${token}/inscripciones`, request); }
  infoAsistencia(token: string): Observable<EncuentroAsistenciaPublica> { return this.http.get<EncuentroAsistenciaPublica>(`${this.publicApi}/asistencia/${token}`); }
  autoAsistencia(token: string, request: { nombreCompleto: string; telefono: string }): Observable<EncuentroAsistencia> { return this.http.post<EncuentroAsistencia>(`${this.publicApi}/asistencia/${token}`, request); }
  exportar(cicloId: number): Observable<Blob> { return this.http.get(`${this.api}/ciclos/${cicloId}/exportar`, { responseType: 'blob' }); }
  importar(cicloId: number, archivo: File): Observable<{ inscripcionesImportadas: number; asistenciasImportadas: number; sinTelefono: number; sinCoincidencia: number; ambiguas: number }> { const body = new FormData(); body.append('archivo', archivo); return this.http.post<{ inscripcionesImportadas: number; asistenciasImportadas: number; sinTelefono: number; sinCoincidencia: number; ambiguas: number }>(`${this.api}/ciclos/${cicloId}/importar`, body); }
  urlExportacion(cicloId: number): string { return `${this.api}/ciclos/${cicloId}/exportar`; }
}
