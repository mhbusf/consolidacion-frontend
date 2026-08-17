// Modelo de Comuna
export interface Comuna {
  id: number;
  nombre: string;
  provincia: string;
  region: string;
}

// ← NUEVO: Modelo de Reunión
export interface Reunion {
  id: number;
  nombre: string;
}

// Interfaz básica de Consolidado
export interface Consolidado {
  id?: number;
  nombre: string;
  telefono: string;
  edad: number;
  quienInvito: string;
  motivoOracion: string;
  comunaId?: number;
  reunionId?: number; // ← NUEVO
  usuarioReporta?: {
    id: number;
    username: string;
  };
  usuarioAsignado?: {
    id: number;
    username: string;
  };
  fechaIngreso?: string;
  fechaIngresoDate?: string;
  estado?: EstadoConsolidado;
  gdc?: string;
  fechaCierre?: string;
  comentarioCierre?: string;
  fechaActualizacion?: string;
}

// Estados del consolidado
export enum EstadoConsolidado {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_PROCESO = 'EN_PROCESO',
  GDC = 'GDC',
  CERRADO = 'CERRADO',
}

export type MotivoCierre = 'NO_QUIERE_CONTACTO' | 'NO_CONTESTA';

export interface CerrarConsolidadoRequest {
  motivo: MotivoCierre;
  comentario?: string;
}

export type TipoCierre = 'GDC' | 'CERRADO';

// Request para crear consolidado
export interface ConsolidadoRequest {
  nombre: string;
  telefono: string;
  edad: number;
  quienInvito: string;
  motivoOracion: string;
  comunaId: number;
  reunionId?: number; // ← NUEVO (opcional)
}

// Response del backend
export interface ConsolidadoResponse {
  id: number;
  nombre: string;
  telefono: string;
  edad: number;
  quienInvito: string;
  motivoOracion: string;
  comuna: Comuna | null;
  usuarioReporta: string | null;
  usuarioAsignado: string | null;
  usuarioAsigno: string | null;
  fechaIngreso: string;
  estado?: string;
  hitoTresSemanasCumplido: boolean;
  gdc: string | null;
  fechaCierre: string | null;
  comentarioCierre: string | null;
  fechaActualizacion?: string;
}

// Para Dashboard
export interface ComentarioPendiente {
  tipo: string;
  fechaEsperada: string;
  diasDeAtraso: number;
}

export interface ConsolidadoEstado {
  id: number;
  titulo: string;
  fechaIngreso: string;
  asignadoA: string;
  estado: string;
  comentariosPendientes: ComentarioPendiente[];
  diasDeAtraso: number;
}

export interface UsuarioEstadistica {
  username: string;
  email: string;
  totalAsignados: number;
  alDia: number;
  conAtrasos: number;
}

export interface ReunionEstadistica {
  nombreReunion: string;
  totalConsolidados: number;
}

export interface ConsolidadoGDCHistorico {
  id: number;
  consolidadoId: number;
  nombre: string | null;
  telefono: string | null;
  edad: number | null;
  quienInvito: string | null;
  motivoOracion: string | null;
  gdc: string | null;
  tipoCierre: TipoCierre;
  comentarioCierre: string | null;
  fechaCierre: string | null;
  fechaIngresoDate: string | null;
  usuarioAsignado: string | null;
  usuarioReporta: string | null;
  comunaNombre: string | null;
  region: string | null;
  provincia: string | null;
  reunionNombre: string | null;
  fechaRegistro: string | null;
}

export interface Dashboard {
  totalConsolidados: number;
  consolidadosEnProceso: number;
  consolidadosConGDC: number;
  consolidadosCerrados: number;
  consolidadosAlDia: number;
  consolidadosAtrasados: number;
  consolidadosSinAsignar: number;
  consolidadosConAtrasos: ConsolidadoEstado[];
  estadisticasPorUsuario: UsuarioEstadistica[];
  estadisticasPorReunion: ReunionEstadistica[];
  totalCafeConJesus: number;
}

export interface DuplicateMatch {
  origen: string;
  id: number;
  nombre: string;
  telefono: string;
  estado: string;
  detalle: string;
  coincidencia: string;
}

export interface DuplicateValidationResponse {
  message: string;
  coincidencias: DuplicateMatch[];
}
