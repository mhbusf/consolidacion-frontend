import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { EncuentroMentoriaService } from './encuentro-mentoria.service';

describe('EncuentroMentoriaService', () => {
  let service: EncuentroMentoriaService;
  let http: HttpTestingController;
  const mentorApi = `${environment.apiUrl}/encuentro-poder/mentor`;
  const encuentroApi = `${environment.apiUrl}/encuentro-poder`;
  const participante = {
    inscripcionId: 42,
    fechaInscripcion: '2026-09-20T10:00:00',
    persona: {
      id: 10,
      nombreCompleto: 'Ana Pérez',
      telefono: '+56911111111',
      comuna: 'Santiago',
      invitadoPor: 'Pedro',
      tiempoCatedral: '1 año',
    },
    ciclo: { id: 7, nombre: 'Octubre 2026', fechaInicio: '2026-10-01', fechaCierre: null, estado: 'ABIERTO' },
    mentor: null,
    progreso: {
      clasesCompletadas: 1,
      totalClasesObligatorias: 3,
      asistencias: [{ claseId: 1, clase: 'Clase 1', fecha: '2026-10-01', obligatoria: true, presente: true }],
    },
    ultimoFeedback: null,
  };
  const feedback = {
    id: 1,
    inscripcionId: 42,
    autor: { id: 9, username: 'mentor', nombre: 'Mentor', apellido: 'Uno' },
    contenido: 'Seguimiento',
    fechaCreacion: '2026-10-02T10:00:00',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EncuentroMentoriaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta los participantes propios sin username ni mentorId', () => {
    service.misParticipantes().subscribe();

    const request = http.expectOne(`${mentorApi}/participantes`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush([]);
  });

  it('consulta detalle y feedback por inscripción', () => {
    service.participante(42).subscribe();
    service.feedback(42).subscribe();

    const detail = http.expectOne(`${mentorApi}/participantes/42`);
    const feedback = http.expectOne(`${mentorApi}/participantes/42/feedback`);
    expect(detail.request.method).toBe('GET');
    expect(feedback.request.method).toBe('GET');
    detail.flush(participante);
    feedback.flush([]);
  });

  it('adapta comentario al contrato contenido del backend', () => {
    let resultado: { comentario: string; mentorNombre: string } | undefined;
    service.crearFeedback(42, { comentario: 'Seguimiento' }).subscribe(value => resultado = value);

    const request = http.expectOne(`${mentorApi}/participantes/42/feedback`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ contenido: 'Seguimiento' });
    request.flush(feedback);
    expect(resultado?.comentario).toBe('Seguimiento');
    expect(resultado?.mentorNombre).toBe('Mentor Uno');
  });

  it('usa los contratos administrativos del backend para asignar y desasignar', () => {
    service.asignaciones(7).subscribe();
    service.mentoresHabilitados().subscribe();
    service.asignarMentor(42, 9).subscribe();
    service.desasignarMentor(42).subscribe();

    http.expectOne(`${encuentroApi}/ciclos/7/mentorias`).flush([]);
    const mentors = http.expectOne(`${encuentroApi}/mentores`);
    mentors.flush([]);
    const updates = http.match(`${encuentroApi}/inscripciones/42/mentor`);
    expect(updates.length).toBe(2);
    const assign = updates.find(request => request.request.body.mentorId === 9)!;
    expect(assign.request.body).toEqual({ mentorId: 9 });
    assign.flush(participante);
    const unassign = updates.find(request => request.request.body.mentorId === null)!;
    expect(unassign.request.method).toBe('PUT');
    unassign.flush(participante);
  });

  it('usa los contratos de ciclos y asistencia del mentor', () => {
    service.ciclosAsistencia().subscribe();
    service.asistenciaClase(7, 3).subscribe();
    service.marcarPresente(10, 3).subscribe();

    const ciclos = http.expectOne(`${mentorApi}/ciclos`);
    expect(ciclos.request.method).toBe('GET');
    ciclos.flush([]);
    const asistencia = http.expectOne(request => request.url === `${mentorApi}/ciclos/7/asistencia`);
    expect(asistencia.request.params.get('claseId')).toBe('3');
    asistencia.flush({ cicloId: 7, claseId: 3, claseNombre: 'Clase 3', estado: 'FINALIZADA', participantes: [] });
    const marcar = http.expectOne(`${mentorApi}/asistencias`);
    expect(marcar.request.method).toBe('POST');
    expect(marcar.request.body).toEqual({ personaId: 10, claseId: 3 });
    marcar.flush({
      id: 1, personaId: 10, claseId: 3, clase: 'Clase 3', metodo: 'MANUAL', fechaHora: '2026-10-03T10:00:00',
    });
  });
});
