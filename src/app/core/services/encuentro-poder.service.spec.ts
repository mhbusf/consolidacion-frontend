import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { EncuentroPoderService } from './encuentro-poder.service';

describe('EncuentroPoderService', () => {
  let service: EncuentroPoderService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/encuentro-poder`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EncuentroPoderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta las inscripciones del ciclo', () => {
    service.inscritos(7).subscribe();

    const request = http.expectOne(`${api}/ciclos/7/inscritos`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('actualiza datos globales y del ciclo usando la inscripción', () => {
    const body = {
      nombreCompleto: 'Ana Corregida',
      telefono: '56911111111',
      comuna: 'Santiago',
      invitadoPor: 'Pedro Servidor',
      tiempoCatedral: '1 año',
      personaRevision: 'revision-1',
    };
    service.actualizarInscripcion(41, body).subscribe();

    const request = http.expectOne(`${api}/inscripciones/41`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush({
      id: 41,
      persona: { id: 21, nombreCompleto: body.nombreCompleto, telefono: body.telefono, comuna: body.comuna },
      cicloId: 7,
      fechaInscripcion: '2026-10-01T10:00:00',
      estadoParticipacion: 'ACTIVO',
      invitadoPor: body.invitadoPor,
      tiempoCatedral: body.tiempoCatedral,
      personaRevision: 'revision-2',
    });
  });
});
