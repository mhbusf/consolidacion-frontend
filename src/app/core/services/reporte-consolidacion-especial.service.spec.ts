import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parametrosReporteConsolidacionEspecial, ReporteConsolidacionEspecialService } from './reporte-consolidacion-especial.service';

describe('parametrosReporteConsolidacionEspecial', () => {
  it('incluye filtros comunes sin valores vacíos', () => {
    const params = parametrosReporteConsolidacionEspecial({
      desde: '2026-10-01',
      hasta: '2026-10-31',
      reunionId: 4,
      usuarioAsignadoId: 8,
    }, 'seguimiento');

    expect(params.get('desde')).toBe('2026-10-01');
    expect(params.get('reunionId')).toBe('4');
    expect(params.has('tipoCierre')).toBeFalse();
  });

  it('envía filtros de cierre solamente al histórico', () => {
    const filtros = {
      desde: '2026-10-01',
      hasta: '2026-10-31',
      tipoCierre: 'GDC' as const,
      motivo: 'contacto',
      gdc: 'Norte',
    };

    expect(parametrosReporteConsolidacionEspecial(filtros, 'historico').get('tipoCierre')).toBe('GDC');
    expect(parametrosReporteConsolidacionEspecial(filtros, 'ejecutivo').has('tipoCierre')).toBeFalse();
  });
});

describe('ReporteConsolidacionEspecialService', () => {
  let service: ReporteConsolidacionEspecialService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReporteConsolidacionEspecialService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cancela la carga de metadata que excede 15 segundos', fakeAsync(() => {
    let receivedError: unknown;
    service.metadata().subscribe({ error: error => { receivedError = error; } });
    const request = http.expectOne(`${environment.apiUrl}/reportes/consolidados/metadata`);

    tick(15_001);

    expect(receivedError).toBeInstanceOf(TimeoutError);
    expect(request.cancelled).toBeTrue();
  }));
});
