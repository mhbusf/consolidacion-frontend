 export interface Consolidado {
  id?: number;
  nombre: string;
  telefono: string;
  edad: number;
  quienInvito: string;
  motivoOracion: string;
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

export enum EstadoConsolidado {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_PROCESO = 'EN_PROCESO',
  GDC = 'GDC',
  CERRADO = 'CERRADO'
}

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

export interface Dashboard {
  totalConsolidados: number;
  consolidadosEnProceso: number;
  consolidadosConGDC: number;
  consolidadosCerrados: number;
  consolidadosAlDia: number;
  consolidadosAtrasados: number;
  consolidadosConAtrasos: ConsolidadoEstado[];
}