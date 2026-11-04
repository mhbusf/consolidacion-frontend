import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReporteConsolidadoService } from './reporte-consolidado.service';

describe('ReporteConsolidadoService', () => {
  let service: ReporteConsolidadoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReporteConsolidadoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cancela la carga de opciones que excede 15 segundos', fakeAsync(() => {
    let receivedError: unknown;
    service.obtenerOpciones().subscribe({ error: error => { receivedError = error; } });
    const request = http.expectOne(`${environment.apiUrl}/reportes/consolidados/opciones`);

    tick(15_001);

    expect(receivedError).toBeInstanceOf(TimeoutError);
    expect(request.cancelled).toBeTrue();
  }));
});
