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

  it('exporta todos los consolidados activos sin limitarse al mes actual', () => {
    service.exportarActivos().subscribe(response => {
      expect(response.body).toBeTruthy();
    });

    const request = http.expectOne(req =>
      req.url === `${environment.apiUrl}/reportes/consolidados/xlsx`
      && req.params.get('desde') === '0001-01-01'
      && req.params.get('hasta') === '9999-12-30'
      && req.params.get('alcance') === 'ACTIVOS'
    );
    expect(request.request.method).toBe('GET');
    request.flush(new Blob(['excel']));
  });

  it('no envía el parámetro legado del hito de tres semanas', () => {
    service.exportar({
      desde: '2026-11-01',
      hasta: '2026-11-16',
      alcance: 'TODOS',
      hitoTresSemanasCumplido: true,
    } as Parameters<ReporteConsolidadoService['exportar']>[0] & { hitoTresSemanasCumplido: boolean })
      .subscribe();

    const request = http.expectOne(req => req.url === `${environment.apiUrl}/reportes/consolidados/xlsx`);
    expect(request.request.params.has('hitoTresSemanasCumplido')).toBeFalse();
    request.flush(new Blob(['excel']));
  });
});
