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
  cicloEstado: 'ABIERTO' | 'CERRADO';
  etapaMentoria: 'ACTIVA' | 'CIERRE' | 'HISTORICA';
  cierreHasta: string | null;
  ultimoFeedback?: EncuentroMentorFeedback | null;
}

export interface EncuentroMentorResumenPortal {
  ciclo: {
    id: number;
    nombre: string;
    fechaInicio: string;
    fechaCierre: string | null;
    estado: 'ABIERTO' | 'CERRADO';
  } | null;
  participantesAsignados: number;
  asistenciasRegistradas: number;
  asistenciasEsperadas: number;
  porcentajeAsistencia: number;
  participantesCompletos: number;
  participantesPendientes: number;
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

export interface EncuentroMentorClase {
  id: number;
  nombre: string;
  orden: number;
  fecha: string;
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA';
  obligatoria: boolean;
}

export interface EncuentroMentorCiclo {
  id: number;
  nombre: string;
  estado: string;
  clases: EncuentroMentorClase[];
}

export interface EncuentroMentorAsistenciaParticipante {
  inscripcionId: number;
  personaId: number;
  nombreCompleto: string;
  telefono: string;
  presente: boolean;
}

export interface EncuentroMentorAsistenciaClase {
  cicloId: number;
  claseId: number;
  claseNombre: string;
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA';
  participantes: EncuentroMentorAsistenciaParticipante[];
}

export interface EncuentroMentorRegistroAsistencia {
  id: number;
  personaId: number;
  claseId: number;
  clase: string;
  metodo: string;
  fechaHora: string;
}
