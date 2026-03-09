import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dashboard, ConsolidadoGDCHistorico } from '../models/consolidado.model';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;
  private historicoUrl = `${environment.apiUrl}/historico`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(this.apiUrl);
  }

  getHistorico(): Observable<ConsolidadoGDCHistorico[]> {
    return this.http.get<ConsolidadoGDCHistorico[]>(this.historicoUrl);
  }
}
