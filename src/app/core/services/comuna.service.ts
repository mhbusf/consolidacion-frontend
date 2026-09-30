import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, shareReplay, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comuna } from '../models/consolidado.model';

@Injectable({
  providedIn: 'root'
})
export class ComunaService {
  private apiUrl = `${environment.apiUrl}/comunas`;
  private todas$?: Observable<Comuna[]>;

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<Comuna[]> {
    this.todas$ ??= this.http.get<Comuna[]>(this.apiUrl).pipe(
      catchError(error => {
        this.todas$ = undefined;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.todas$;
  }

  listarPorRegion(region: string): Observable<Comuna[]> {
    return this.http.get<Comuna[]>(`${this.apiUrl}/region/${region}`);
  }

  listarPorProvincia(provincia: string): Observable<Comuna[]> {
    return this.http.get<Comuna[]>(`${this.apiUrl}/provincia/${provincia}`);
  }
}
