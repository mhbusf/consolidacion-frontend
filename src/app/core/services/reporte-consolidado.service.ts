import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ReporteConsolidadoConsulta,
  ReporteConsolidadoFiltros,
  ReporteConsolidadoOpciones,
  ReporteConsolidadoPagina,
} from '../models/reporte-consolidado.model';

export interface ReporteConsolidadoPaginacion {
  readonly page: number;
  readonly size: number;
}

export function construirParametrosReporteConsolidado(
  filtros: ReporteConsolidadoFiltros,
  paginacion?: ReporteConsolidadoPaginacion,
): HttpParams {
  let params = new HttpParams()
    .set('desde', filtros.desde)
    .set('hasta', filtros.hasta)
    .set('alcance', filtros.alcance);

  if (filtros.reunionId !== undefined) {
    params = params.set('reunionId', filtros.reunionId);
  }
  if (filtros.estado !== undefined) {
    params = params.set('estado', filtros.estado);
  }
  if (filtros.usuarioAsignadoId !== undefined) {
    params = params.set('usuarioAsignadoId', filtros.usuarioAsignadoId);
  }
  if (filtros.usuarioReportaId !== undefined) {
    params = params.set('usuarioReportaId', filtros.usuarioReportaId);
  }
  if (filtros.sinAsignar !== undefined) {
    params = params.set('sinAsignar', filtros.sinAsignar);
  }
  if (filtros.comunaId !== undefined) {
    params = params.set('comunaId', filtros.comunaId);
  }
  if (filtros.origenCafeConJesus !== undefined) {
    params = params.set('origenCafeConJesus', filtros.origenCafeConJesus);
  }
  if (filtros.hitoTresSemanasCumplido !== undefined) {
    params = params.set('hitoTresSemanasCumplido', filtros.hitoTresSemanasCumplido);
  }
  if (filtros.conGdc !== undefined) {
    params = params.set('conGdc', filtros.conGdc);
  }
  if (filtros.texto !== undefined) {
    params = params.set('texto', filtros.texto);
  }
  if (paginacion !== undefined) {
    params = params
      .set('page', paginacion.page)
      .set('size', paginacion.size);
  }

  return params;
}

@Injectable({
  providedIn: 'root',
})
export class ReporteConsolidadoService {
  private readonly apiUrl = `${environment.apiUrl}/reportes/consolidados`;

  constructor(private readonly http: HttpClient) {}

  consultar(consulta: ReporteConsolidadoConsulta): Observable<ReporteConsolidadoPagina> {
    const params = construirParametrosReporteConsolidado(consulta, consulta);
    return this.http.get<ReporteConsolidadoPagina>(this.apiUrl, { params });
  }

  obtenerOpciones(): Observable<ReporteConsolidadoOpciones> {
    return this.http.get<ReporteConsolidadoOpciones>(`${this.apiUrl}/opciones`);
  }

  exportar(filtros: ReporteConsolidadoFiltros): Observable<HttpResponse<Blob>> {
    const params = construirParametrosReporteConsolidado(filtros);
    return this.http.get(`${this.apiUrl}/xlsx`, {
      params,
      observe: 'response',
      responseType: 'blob',
    });
  }
}
