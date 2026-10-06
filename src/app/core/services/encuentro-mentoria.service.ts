import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CrearEncuentroMentorFeedback,
  EncuentroAsignacionMentor,
  EncuentroMentorFeedback,
  EncuentroMentorAsistenciaClase,
  EncuentroMentorCiclo,
  EncuentroMentorRegistroAsistencia,
  EncuentroMentorOpcion,
  EncuentroMentorParticipante,
  EncuentroMentorParticipanteDetalle,
} from '../models/encuentro-mentoria.model';

@Injectable({ providedIn: 'root' })
export class EncuentroMentoriaService {
  private readonly mentorApi = `${environment.apiUrl}/encuentro-poder/mentor`;
  private readonly encuentroApi = `${environment.apiUrl}/encuentro-poder`;

  constructor(private readonly http: HttpClient) {}

  misParticipantes(): Observable<EncuentroMentorParticipante[]> {
    return this.http.get<ParticipanteMentorResponse[]>(`${this.mentorApi}/participantes`).pipe(
      map(participantes => participantes.map(participante => this.resumenParticipante(participante))),
    );
  }

  participante(inscripcionId: number): Observable<EncuentroMentorParticipanteDetalle> {
    return this.http.get<ParticipanteMentorResponse>(`${this.mentorApi}/participantes/${inscripcionId}`).pipe(
      map(participante => this.detalleParticipante(participante)),
    );
  }

  feedback(inscripcionId: number): Observable<EncuentroMentorFeedback[]> {
    return this.http.get<FeedbackResponse[]>(`${this.mentorApi}/participantes/${inscripcionId}/feedback`).pipe(
      map(feedback => feedback.map(item => this.feedbackResponse(item))),
    );
  }

  crearFeedback(inscripcionId: number, request: CrearEncuentroMentorFeedback): Observable<EncuentroMentorFeedback> {
    return this.http.post<FeedbackResponse>(`${this.mentorApi}/participantes/${inscripcionId}/feedback`, {
      contenido: request.comentario,
    }).pipe(map(feedback => this.feedbackResponse(feedback)));
  }

  mentoresHabilitados(): Observable<EncuentroMentorOpcion[]> {
    return this.http.get<MentorResponse[]>(`${this.encuentroApi}/mentores`).pipe(
      map(mentores => mentores.map(mentor => this.mentorOpcion(mentor))),
    );
  }

  asignaciones(cicloId: number): Observable<EncuentroAsignacionMentor[]> {
    return this.http.get<ParticipanteMentorResponse[]>(`${this.encuentroApi}/ciclos/${cicloId}/mentorias`).pipe(
      map(asignaciones => asignaciones.map(asignacion => this.asignacion(asignacion))),
    );
  }

  asignarMentor(inscripcionId: number, mentorId: number): Observable<EncuentroAsignacionMentor> {
    return this.http.put<ParticipanteMentorResponse>(
      `${this.encuentroApi}/inscripciones/${inscripcionId}/mentor`,
      { mentorId },
    ).pipe(map(asignacion => this.asignacion(asignacion)));
  }

  desasignarMentor(inscripcionId: number): Observable<EncuentroAsignacionMentor> {
    return this.http.put<ParticipanteMentorResponse>(
      `${this.encuentroApi}/inscripciones/${inscripcionId}/mentor`,
      { mentorId: null },
    ).pipe(map(asignacion => this.asignacion(asignacion)));
  }

  ciclosAsistencia(): Observable<EncuentroMentorCiclo[]> {
    return this.http.get<EncuentroMentorCiclo[]>(`${this.mentorApi}/ciclos`);
  }

  asistenciaClase(cicloId: number, claseId: number): Observable<EncuentroMentorAsistenciaClase> {
    const params = new HttpParams().set('claseId', claseId);
    return this.http.get<EncuentroMentorAsistenciaClase>(`${this.mentorApi}/ciclos/${cicloId}/asistencia`, { params });
  }

  marcarPresente(personaId: number, claseId: number): Observable<EncuentroMentorRegistroAsistencia> {
    return this.http.post<EncuentroMentorRegistroAsistencia>(`${this.mentorApi}/asistencias`, { personaId, claseId });
  }

  private resumenParticipante(response: ParticipanteMentorResponse): EncuentroMentorParticipante {
    const totalClases = response.progreso.totalClasesObligatorias;
    const clasesCompletadas = response.progreso.clasesCompletadas;
    return {
      inscripcionId: response.inscripcionId,
      personaId: response.persona.id,
      cicloId: response.ciclo.id,
      cicloNombre: response.ciclo.nombre,
      nombreCompleto: response.persona.nombreCompleto,
      telefono: response.persona.telefono,
      comuna: response.persona.comuna,
      clasesCompletadas,
      totalClases,
      porcentajeProgreso: totalClases ? Math.round(clasesCompletadas / totalClases * 100) : 0,
      ultimoFeedback: response.ultimoFeedback ? this.feedbackResponse(response.ultimoFeedback) : null,
    };
  }

  private detalleParticipante(response: ParticipanteMentorResponse): EncuentroMentorParticipanteDetalle {
    return {
      ...this.resumenParticipante(response),
      fechaInscripcion: response.fechaInscripcion,
      invitadoPor: response.persona.invitadoPor,
      tiempoCatedral: response.persona.tiempoCatedral,
      asistencias: response.progreso.asistencias
        .filter(asistencia => asistencia.obligatoria)
        .map(asistencia => ({
          claseId: asistencia.claseId,
          claseNombre: asistencia.clase,
          fecha: asistencia.fecha,
          asistio: asistencia.presente,
        })),
    };
  }

  private feedbackResponse(response: FeedbackResponse): EncuentroMentorFeedback {
    return {
      id: response.id,
      comentario: response.contenido,
      fechaCreacion: response.fechaCreacion,
      mentorNombre: [response.autor.nombre, response.autor.apellido].filter(Boolean).join(' ') || response.autor.username,
    };
  }

  private mentorOpcion(response: MentorResponse): EncuentroMentorOpcion {
    return {
      id: response.id,
      username: response.username,
      nombreCompleto: [response.nombre, response.apellido].filter(Boolean).join(' ') || response.username,
      email: response.email,
      enabled: true,
    };
  }

  private asignacion(response: ParticipanteMentorResponse): EncuentroAsignacionMentor {
    return {
      inscripcionId: response.inscripcionId,
      personaId: response.persona.id,
      nombreCompleto: response.persona.nombreCompleto,
      telefono: response.persona.telefono,
      mentor: response.mentor ? this.mentorOpcion(response.mentor) : null,
    };
  }
}

interface MentorResponse {
  id: number;
  username: string;
  nombre: string | null;
  apellido: string | null;
  email: string;
}

interface FeedbackResponse {
  id: number;
  inscripcionId: number;
  autor: { id: number; username: string; nombre: string | null; apellido: string | null };
  contenido: string;
  fechaCreacion: string;
}

interface ParticipanteMentorResponse {
  inscripcionId: number;
  fechaInscripcion: string;
  persona: {
    id: number;
    nombreCompleto: string;
    telefono: string;
    comuna: string | null;
    invitadoPor: string | null;
    tiempoCatedral: string | null;
  };
  ciclo: { id: number; nombre: string; fechaInicio: string; fechaCierre: string | null; estado: string };
  mentor: MentorResponse | null;
  progreso: {
    clasesCompletadas: number;
    totalClasesObligatorias: number;
    asistencias: Array<{
      claseId: number;
      clase: string;
      fecha: string;
      obligatoria: boolean;
      presente: boolean;
    }>;
  };
  ultimoFeedback: FeedbackResponse | null;
}
