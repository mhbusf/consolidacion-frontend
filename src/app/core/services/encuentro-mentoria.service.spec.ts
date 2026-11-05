import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { EncuentroAsignacionMentor } from '../models/encuentro-mentoria.model';
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
    },
    invitadoPor: 'Pedro',
    tiempoCatedral: '1 año',
    ciclo: { id: 7, nombre: 'Octubre 2026', fechaInicio: '2026-10-01', fechaCierre: null, estado: 'ABIERTO' },
    mentor: null,
    progreso: {
      clasesCompletadas: 1,
      totalClasesObligatorias: 3,
      asistencias: [
        { claseId: 1, clase: 'Clase 1', orden: 1, fecha: '2026-10-08', obligatoria: true, presente: true },
        { claseId: 0, clase: 'Clase 0 - Informativa', orden: 0, fecha: '2026-10-01', obligatoria: false, presente: true },
      ],
    },
    ultimoFeedback: null,
    etapaMentoria: 'ACTIVA' as const,
    cierreHasta: '2026-10-22',
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

  it('consulta los participantes propios y conserva la asistencia desde clase 0', () => {
    let resultado: Array<{ asistencias: Array<{ orden: number; obligatoria: boolean }> }> = [];
    service.misParticipantes().subscribe(participantes => resultado = participantes);

    const request = http.expectOne(`${mentorApi}/participantes`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush([participante]);
    expect(resultado[0].asistencias).toEqual([
      jasmine.objectContaining({ orden: 0, obligatoria: false }),
      jasmine.objectContaining({ orden: 1, obligatoria: true }),
    ]);
  });

  it('consulta el resumen del ciclo abierto del mentor', () => {
    service.resumenPortal().subscribe();

    const request = http.expectOne(`${mentorApi}/resumen`);
    expect(request.request.method).toBe('GET');
    request.flush({
      ciclo: null, participantesAsignados: 0, asistenciasRegistradas: 0, asistenciasEsperadas: 0,
      porcentajeAsistencia: 0, participantesCompletos: 0, participantesPendientes: 0,
    });
  });

  it('envía el ciclo seleccionado al consultar participantes y resumen', () => {
    service.misParticipantes(9).subscribe();
    service.resumenPortal(9).subscribe();

    const participantes = http.expectOne(request => request.url === `${mentorApi}/participantes`);
    const resumen = http.expectOne(request => request.url === `${mentorApi}/resumen`);
    expect(participantes.request.params.get('cicloId')).toBe('9');
    expect(resumen.request.params.get('cicloId')).toBe('9');
    participantes.flush([]);
    resumen.flush({
      ciclo: null, participantesAsignados: 0, asistenciasRegistradas: 0, asistenciasEsperadas: 0,
      porcentajeAsistencia: 0, participantesCompletos: 0, participantesPendientes: 0,
    });
  });

  it('consulta detalle y conserva la asistencia de clase 0', () => {
    let detalle: { etapaMentoria: string; cierreHasta: string | null; asistencias: Array<{ orden: number; obligatoria: boolean }> } | undefined;
    service.participante(42).subscribe(response => detalle = response);
    service.feedback(42).subscribe();

    const detail = http.expectOne(`${mentorApi}/participantes/42`);
    const feedback = http.expectOne(`${mentorApi}/participantes/42/feedback`);
    expect(detail.request.method).toBe('GET');
    expect(feedback.request.method).toBe('GET');
    detail.flush(participante);
    feedback.flush([]);
    expect(detalle?.etapaMentoria).toBe('ACTIVA');
    expect(detalle?.cierreHasta).toBe('2026-10-22');
    expect(detalle?.asistencias).toEqual([
      jasmine.objectContaining({ orden: 0, obligatoria: false }),
      jasmine.objectContaining({ orden: 1, obligatoria: true }),
    ]);
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
    let asignaciones: EncuentroAsignacionMentor[] = [];
    service.asignaciones(7).subscribe(response => asignaciones = response);
    service.mentoresHabilitados().subscribe();
    service.asignarMentor(42, 9).subscribe();
    service.desasignarMentor(42).subscribe();

    http.expectOne(`${encuentroApi}/ciclos/7/mentorias`).flush([participante]);
    expect(asignaciones[0].invitadoPor).toBe('Pedro');
    expect(asignaciones[0].asistencias.map(asistencia => asistencia.orden)).toEqual([0, 1]);
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

  it('consulta el cumplimiento semanal de feedback del ciclo', () => {
    service.cumplimientoFeedback(7).subscribe();

    const request = http.expectOne(`${encuentroApi}/ciclos/7/mentorias/cumplimiento-feedback`);
    expect(request.request.method).toBe('GET');
    request.flush({
      ciclo: participante.ciclo,
      fechaCorte: '2026-10-09',
      requeridos: 2,
      cumplidos: 1,
      porcentaje: 50,
      periodos: [],
    });
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
