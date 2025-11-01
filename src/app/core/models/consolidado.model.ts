// Modelo de Comuna
export interface Comuna {
  id: number;
  nombre: string;
  provincia: string;
  region: string;
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
  CERRADO = 'CERRADO'
}

// Request para crear consolidado
export interface ConsolidadoRequest {
  nombre: string;
  telefono: string;
  edad: number;
  quienInvito: string;
  motivoOracion: string;
  comunaId: number;  // ← NUEVO
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
  usuarioReporta: string | null;  // ← CAMBIAR A STRING (no objeto)
  usuarioAsignado: string | null; // ← CAMBIAR A STRING (no objeto)
  fechaIngreso: string;
  estado?: string;
  gdc?: string;
  fechaCierre?: string;
  comentarioCierre?: string;
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

export interface Dashboard {
  totalConsolidados: number;
  consolidadosEnProceso: number;
  consolidadosConGDC: number;
  consolidadosCerrados: number;
  consolidadosAlDia: number;
  consolidadosAtrasados: number;
  consolidadosConAtrasos: ConsolidadoEstado[];
  estadisticasPorUsuario: UsuarioEstadistica[];
}