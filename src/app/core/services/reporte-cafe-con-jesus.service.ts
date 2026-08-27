import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ReporteCafeConsulta,
  ReporteCafeFiltros,
  ReporteCafeOpciones,
  ReporteCafePagina,
} from '../models/reporte-cafe-con-jesus.model';

export function construirParametrosReporteCafe(
  filtros: ReporteCafeFiltros,
  paginacion?: Pick<ReporteCafeConsulta, 'page' | 'size'>,
): HttpParams {
  let params = new HttpParams().set('desde', filtros.desde).set('hasta', filtros.hasta);
  const opcionales: Record<string, string | number | boolean | undefined> = {
    reunionId: filtros.reunionId,
    estado: filtros.estado,
    etapa: filtros.etapa,
    usuarioAsignadoId: filtros.usuarioAsignadoId,
    registradoPorId: filtros.registradoPorId,
    sinAsignar: filtros.sinAsignar,
    asistio: filtros.asistio,
    aceptoAlSenor: filtros.aceptoAlSenor,
    convertidoAConsolidado: filtros.convertidoAConsolidado,
    archivado: filtros.archivado,
    texto: filtros.texto,
  };
  for (const [clave, valor] of Object.entries(opcionales)) {
    if (valor !== undefined) params = params.set(clave, valor);
  }
  if (paginacion) params = params.set('page', paginacion.page).set('size', paginacion.size);
  return params;
}

@Injectable({ providedIn: 'root' })
export class ReporteCafeConJesusService {
  private readonly apiUrl = `${environment.apiUrl}/reportes/cafe-con-jesus`;

  constructor(private readonly http: HttpClient) {}

  consultar(consulta: ReporteCafeConsulta): Observable<ReporteCafePagina> {
    return this.http.get<ReporteCafePagina>(this.apiUrl, {
      params: construirParametrosReporteCafe(consulta, consulta),
    });
  }

  obtenerOpciones(): Observable<ReporteCafeOpciones> {
    return this.http.get<ReporteCafeOpciones>(`${this.apiUrl}/opciones`);
  }

  exportar(filtros: ReporteCafeFiltros): Observable<HttpResponse<Blob>> {
    return this.http.get(this.apiUrl + '/xlsx', {
      params: construirParametrosReporteCafe(filtros),
      observe: 'response',
      responseType: 'blob',
    });
  }
}
