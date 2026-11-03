import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ReporteConsolidacionEspecialFiltros,
  ReporteConsolidacionEspecialMetadata,
  ReporteConsolidacionEspecialPreview,
  TipoReporteConsolidacionEspecial,
} from '../models/reporte-consolidacion-especial.model';

export function parametrosReporteConsolidacionEspecial(
  filtros: ReporteConsolidacionEspecialFiltros,
  tipo: TipoReporteConsolidacionEspecial,
): HttpParams {
  let params = new HttpParams().set('desde', filtros.desde).set('hasta', filtros.hasta);
  const opcionales: ReadonlyArray<readonly [string, string | number | undefined]> = [
    ['reunionId', filtros.reunionId],
    ['usuarioAsignadoId', filtros.usuarioAsignadoId],
    ['comunaId', filtros.comunaId],
  ];
  for (const [nombre, valor] of opcionales) {
    if (valor !== undefined) params = params.set(nombre, valor);
  }
  if (tipo === 'historico') {
    if (filtros.tipoCierre) params = params.set('tipoCierre', filtros.tipoCierre);
    if (filtros.motivo) params = params.set('motivo', filtros.motivo);
    if (filtros.gdc) params = params.set('gdc', filtros.gdc);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class ReporteConsolidacionEspecialService {
  private readonly api = `${environment.apiUrl}/reportes/consolidados`;

  constructor(private readonly http: HttpClient) {}

  metadata(): Observable<ReporteConsolidacionEspecialMetadata> {
    return this.http.get<ReporteConsolidacionEspecialMetadata>(`${this.api}/metadata`);
  }

  preview(
    tipo: TipoReporteConsolidacionEspecial,
    filtros: ReporteConsolidacionEspecialFiltros,
  ): Observable<ReporteConsolidacionEspecialPreview> {
    return this.http.get<ReporteConsolidacionEspecialPreview>(`${this.api}/${tipo}/preview`, {
      params: parametrosReporteConsolidacionEspecial(filtros, tipo),
    });
  }

  descargar(
    tipo: TipoReporteConsolidacionEspecial,
    filtros: ReporteConsolidacionEspecialFiltros,
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.api}/${tipo}/xlsx`, {
      params: parametrosReporteConsolidacionEspecial(filtros, tipo),
      observe: 'response',
      responseType: 'blob',
    });
  }
}
