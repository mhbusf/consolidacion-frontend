import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comuna } from '../models/consolidado.model';

@Injectable({
  providedIn: 'root'
})
export class ComunaService {
  private apiUrl = `${environment.apiUrl}/comunas`;

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<Comuna[]> {
    return this.http.get<Comuna[]>(this.apiUrl);
  }

  listarPorRegion(region: string): Observable<Comuna[]> {
    return this.http.get<Comuna[]>(`${this.apiUrl}/region/${region}`);
  }

  listarPorProvincia(provincia: string): Observable<Comuna[]> {
    return this.http.get<Comuna[]>(`${this.apiUrl}/provincia/${provincia}`);
  }
}