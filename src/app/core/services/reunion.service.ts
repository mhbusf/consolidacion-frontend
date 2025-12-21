import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reunion } from '../models/consolidado.model';

@Injectable({
  providedIn: 'root',
})
export class ReunionService {
  private apiUrl = `${environment.apiUrl}/reuniones`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Reunion[]> {
    return this.http.get<Reunion[]>(this.apiUrl);
  }
}
