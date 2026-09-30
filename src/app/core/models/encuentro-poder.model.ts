export interface EncuentroClase {
  id: number;
  nombre: string;
  orden: number;
  fecha: string;
  obligatoria: boolean;
  publicToken: string;
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
}

export interface EncuentroImportacion {
  inscripcionesImportadas: number;
  asistenciasImportadas: number;
  filasSinTelefono: number;
  asistenciasSinCoincidencia: number;
  asistenciasAmbiguas: number;
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
  conAsistencia: number;
  completos: number;
  pendientes: number;
  clases: { claseId: number; nombre: string; fecha: string; presentes: number; inscritos: number }[];
  participantes: EncuentroParticipante[];
  graduados: EncuentroParticipante[];
}
