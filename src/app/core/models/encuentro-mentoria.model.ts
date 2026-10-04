export interface EncuentroMentorFeedback {
  id: number;
  comentario: string;
  fechaCreacion: string;
  mentorNombre: string;
}

export interface EncuentroMentorParticipante {
  inscripcionId: number;
  personaId: number;
  cicloId: number;
  cicloNombre: string;
  nombreCompleto: string;
  telefono: string;
  comuna?: string | null;
  clasesCompletadas: number;
  totalClases: number;
  porcentajeProgreso: number;
  ultimoFeedback?: EncuentroMentorFeedback | null;
}

export interface EncuentroMentorAsistencia {
  claseId: number;
  claseNombre: string;
  fecha: string;
  asistio: boolean;
}

export interface EncuentroMentorParticipanteDetalle extends EncuentroMentorParticipante {
  fechaInscripcion: string;
  invitadoPor?: string | null;
  tiempoCatedral?: string | null;
  asistencias: EncuentroMentorAsistencia[];
}

export interface CrearEncuentroMentorFeedback {
  comentario: string;
}

export interface EncuentroMentorOpcion {
  id: number;
  username: string;
  nombreCompleto: string;
  email: string;
  enabled: boolean;
}

export interface EncuentroAsignacionMentor {
  inscripcionId: number;
  personaId: number;
  nombreCompleto: string;
  telefono: string;
  mentor: EncuentroMentorOpcion | null;
}
