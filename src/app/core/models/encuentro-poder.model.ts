export type EncuentroEstadoClase = 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA';
export type EncuentroTipoReporte = 'RESUMEN' | 'ASISTENCIA' | 'GRADUACION';
export type EncuentroEstadoParticipacion = 'ACTIVO' | 'NO_CONTINUA';

export interface EncuentroClase {
  id: number;
  nombre: string;
  orden: number;
  fecha: string;
  obligatoria: boolean;
  publicToken: string;
  estado: EncuentroEstadoClase;
}

export interface EncuentroCiclo {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaCierre?: string;
  estado: 'ABIERTO' | 'CERRADO';
  publicToken: string;
  clases: EncuentroClase[];
}

export interface EncuentroPersona {
  id: number;
  nombreCompleto: string;
  telefono: string;
  comuna?: string;
  invitadoPor?: string;
  tiempoCatedral?: string;
}

export interface EncuentroInscripcion {
  id: number;
  persona: EncuentroPersona;
  cicloId: number;
  fechaInscripcion: string;
  estadoParticipacion: EncuentroEstadoParticipacion;
}

export interface EncuentroInscripcionPublica {
  cicloNombre: string;
}

export interface EncuentroAsistencia {
  id: number;
  personaId: number;
  claseId: number;
  clase: string;
  metodo: string;
  fechaHora: string;
}

export interface EncuentroAsistenciaPublica {
  cicloNombre: string;
  claseNombre: string;
  fecha: string;
  inscripcionToken: string;
  estado: EncuentroEstadoClase;
}

export interface EncuentroImportacion {
  inscripcionesImportadas: number;
  asistenciasImportadas: number;
  filasSinTelefono: number;
  asistenciasSinCoincidencia: number;
  asistenciasAmbiguas: number;
  omitidasNoContinua: number;
}

export interface EncuentroContinuidadCandidato {
  inscripcionId: number;
  persona: EncuentroPersona;
  mentorId: number | null;
  mentorNombre: string | null;
}

export interface EncuentroContinuidadPreview {
  cicloId: number;
  claseId: number;
  claseNombre: string;
  disponible: boolean;
  procesada: boolean;
  procesadaEn: string | null;
  previewToken: string | null;
  candidatos: EncuentroContinuidadCandidato[];
}

export interface EncuentroNoContinuidad {
  id: number;
  inscripcionId: number;
  persona: EncuentroPersona;
  motivo: string;
  fechaExclusion: string;
  excluidoPor: string | null;
  mentorAnterior: string | null;
  fechaReintegracion: string | null;
  reintegradoPor: string | null;
  estadoActual: EncuentroEstadoParticipacion;
}

export interface EncuentroContinuidadResultado {
  excluidos: number;
  registros: EncuentroNoContinuidad[];
}

export interface EncuentroParticipante {
  persona: EncuentroPersona;
  inscrito: boolean;
  clasesCompletadas: number;
  clasesFaltantes: string[];
  estado: 'COMPLETO' | 'PENDIENTE';
  asistencias: EncuentroAsistencia[];
}

export interface EncuentroDashboard {
  ciclo: EncuentroCiclo;
  inscritos: number;
  activos: number;
  noContinuaron: number;
  conAsistencia: number;
  completos: number;
  pendientes: number;
  clases: { claseId: number; nombre: string; fecha: string; presentes: number; inscritos: number; ausentes: number; estado: EncuentroEstadoClase }[];
  participantes: EncuentroParticipante[];
  graduados: EncuentroParticipante[];
  historialNoContinuaron: EncuentroNoContinuidad[];
}
