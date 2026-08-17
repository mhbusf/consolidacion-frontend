import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dashboard, ConsolidadoGDCHistorico } from '../models/consolidado.model';
import { environment } from '../../../environments/environment';
import { CafeConJesusResponse } from './cafe-con-jesus.service';

export interface ConsolidadoResumen {
  id: number;
  nombre: string;
  telefono: string;
  edad: number;
  quienInvito: string;
  usuarioAsignado: string;
  fechaIngreso: string;
  estado: string;
}

export interface ConsolidadorResumen {
  username: string;
  totalCafes: number;
  totalConsolidados: number;
  cafes: CafeConJesusResponse[];
  consolidados: ConsolidadoResumen[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;
  private historicoUrl = `${environment.apiUrl}/consolidados/historico`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(this.apiUrl);
  }

  getHistorico(): Observable<ConsolidadoGDCHistorico[]> {
    return this.http.get<ConsolidadoGDCHistorico[]>(this.historicoUrl);
  }

  getResumenConsolidador(username: string): Observable<ConsolidadorResumen> {
    return this.http.get<ConsolidadorResumen>(`${this.apiUrl}/consolidador/${username}`);
  }
}
