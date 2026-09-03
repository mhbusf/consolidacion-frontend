import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export const ETAPAS_CAFE = [
  { value: 'PRIMERA_INVITACION', label: 'Primera Invitación' },
  { value: 'SEGUNDA_INVITACION', label: 'Segunda Invitación' },
  { value: 'TERCERA_INVITACION', label: 'Tercera Invitación' },
  { value: 'ASISTIO_OTRA_VEZ',   label: 'Asistió otra vez a la Cate' },
  { value: 'MENSAJE_FINAL',      label: 'Se deja mensaje final' },
];

export const MOTIVOS_CIERRE_CAFE = [
  { value: 'NO_RESPONDE', label: 'No responde' },
  { value: 'NO_DESEA_CONTACTO', label: 'No desea que lo contacten' },
  { value: 'DATOS_INCORRECTOS', label: 'Datos incorrectos' },
  { value: 'OTRO', label: 'Otro' },
] as const;

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
  reunionId?: number;
  comentario?: string;
  asistio?: boolean;
  fechaAsistencia?: string;
  etapa?: string;
}

export interface CafeComentario {
  id: number;
  contenido: string;
  usuario: string;
  fechaCreacion: string;
}

export interface CafeConJesusResponse {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  edad: string;
  invitadoPor: string;
  telefonoInvitadoPor: string;
  reunionId: number;
  reunionNombre: string;
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
  motivoCierre: string;
  comentarioCierre: string;
  etapa: string;
  comentarios: CafeComentario[];
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
    const params = new HttpParams().set('username', username);
    return this.http.put(`${this.apiUrl}/${id}/asignar`, null, { params, responseType: 'text' });
  }

  convertirAConsolidado(id: number): Observable<CafeConJesusResponse> {
    return this.http.put<CafeConJesusResponse>(`${this.apiUrl}/${id}/convertir`, null);
  }

  obtenerDashboardAdmin(): Observable<CafeAdminDashboard> {
    return this.http.get<CafeAdminDashboard>(`${this.apiUrl}/admin/dashboard`);
  }

  archivar(id: number, motivo: string, comentario: string): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/archivar`, { motivo, comentario }, { responseType: 'text' });
  }

  desarchivar(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/desarchivar`, null, { responseType: 'text' });
  }

  agregarComentario(id: number, contenido: string): Observable<CafeConJesusResponse> {
    return this.http.post<CafeConJesusResponse>(`${this.apiUrl}/${id}/comentarios`, { contenido });
  }
}
