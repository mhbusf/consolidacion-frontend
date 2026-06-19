import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export const ETAPAS_CAFE = [
  { value: 'PRIMERA_INVITACION', label: 'Primera Invitación' },
  { value: 'SEGUNDA_INVITACION', label: 'Segunda Invitación' },
  { value: 'TERCERA_INVITACION', label: 'Tercera Invitación' },
  { value: 'ASISTIO_OTRA_VEZ',   label: 'Asistió otra vez a la Cate' },
  { value: 'MENSAJE_FINAL',      label: 'Se deja mensaje final' },
];

export function etapaLabel(value: string | null | undefined): string {
  return ETAPAS_CAFE.find(e => e.value === value)?.label ?? '—';
}

export interface CafeConJesusRequest {
  nombre: string;
  apellido: string;
  telefono: string;
  edad?: string;
  invitadoPor?: string;
  telefonoInvitadoPor?: string;
  comentario?: string;
  asistio?: boolean;
  fechaAsistencia?: string;
  etapa?: string;
}

export interface CafeConJesusResponse {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  edad: string;
  invitadoPor: string;
  telefonoInvitadoPor: string;
  fechaIngreso: string;
  registradoPor: string;
  usuarioAsignado: string;
  fechaCreacion: string;
  comentario: string;
  asistio: boolean;
  fechaAsistencia: string;
  aceptoAlSenor: boolean;
  convertidoAConsolidado: boolean;
  consolidadoId: number;
  archivado: boolean;
  fechaArchivado: string;
  etapa: string;
}

export interface CafeAdminDashboard {
  sinAsignar: CafeConJesusResponse[];
  asignados: CafeConJesusResponse[];
  pasaronAConsolidacion: CafeConJesusResponse[];
  archivados: CafeConJesusResponse[];
  totalRegistros: number;
  totalSinAsignar: number;
  totalAsignados: number;
  totalPasaronAConsolidacion: number;
  totalArchivados: number;
  totalAsistieron: number;
  totalAceptaronAlSenor: number;
  porcentajeConversion: number;
  etapasResumen: { [key: string]: number };
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

  actualizar(id: number, request: CafeConJesusRequest): Observable<CafeConJesusResponse> {
    return this.http.put<CafeConJesusResponse>(`${this.apiUrl}/${id}`, request);
  }

  asignarUsuario(id: number, username: string): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/asignar?username=${username}`, null, { responseType: 'text' });
  }

  convertirAConsolidado(id: number): Observable<CafeConJesusResponse> {
    return this.http.put<CafeConJesusResponse>(`${this.apiUrl}/${id}/convertir`, null);
  }

  obtenerDashboardAdmin(): Observable<CafeAdminDashboard> {
    return this.http.get<CafeAdminDashboard>(`${this.apiUrl}/admin/dashboard`);
  }

  archivar(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/archivar`, null, { responseType: 'text' });
  }

  desarchivar(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/desarchivar`, null, { responseType: 'text' });
  }
}
