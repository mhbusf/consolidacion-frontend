export type ReporteConsolidadoAlcance = 'TODOS' | 'ACTIVOS' | 'CERRADOS';

export type ReporteConsolidadoEstado =
  | 'PENDIENTE'
  | 'ASIGNADO'
  | 'EN_PROCESO'
  | 'GDC'
  | 'CERRADO';

export interface ReporteConsolidadoUltimoComentario {
  readonly id: number;
  readonly contenido: string | null;
  readonly fechaCreacion: string | null;
  readonly usuario: string | null;
  readonly tipo: string | null;
  readonly numeroSemana: number | null;
  readonly obligatorio: boolean | null;
}

export interface ReporteConsolidado {
  readonly id: number;
  readonly nombre: string | null;
  readonly telefono: string | null;
  readonly edad: number | null;
  readonly quienInvito: string | null;
  readonly motivoOracion: string | null;
  readonly fechaIngreso: string | null;
  readonly estado: ReporteConsolidadoEstado | null;
  readonly estadoDescripcion: string | null;
  readonly reunionId: number | null;
  readonly reunionNombre: string | null;
  readonly comunaId: number | null;
  readonly comunaNombre: string | null;
  readonly provincia: string | null;
  readonly region: string | null;
  readonly usuarioReportaId: number | null;
  readonly usuarioReporta: string | null;
  readonly usuarioAsignadoId: number | null;
  readonly usuarioAsignado: string | null;
  readonly usuarioAsignoId: number | null;
  readonly usuarioAsigno: string | null;
  readonly origenCafeConJesus: boolean | null;
  readonly cafeConJesusId: number | null;
  readonly hitoTresSemanasCumplido: boolean | null;
  readonly gdc: string | null;
  readonly fechaCierre: string | null;
  readonly comentarioCierre: string | null;
  readonly ultimoComentario: ReporteConsolidadoUltimoComentario | null;
}

export interface ReporteConsolidadoPagina {
  readonly content: readonly ReporteConsolidado[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly first: boolean;
  readonly last: boolean;
}

export interface ReporteConsolidadoReunionOpcion {
  readonly id: number;
  readonly nombre: string | null;
}

export interface ReporteConsolidadoComunaOpcion {
  readonly id: number;
  readonly nombre: string | null;
}

export interface ReporteConsolidadoUsuarioOpcion {
  readonly id: number;
  readonly username: string | null;
  readonly nombreCompleto: string | null;
}

export interface ReporteConsolidadoOpciones {
  readonly reuniones: readonly ReporteConsolidadoReunionOpcion[];
  readonly comunas: readonly ReporteConsolidadoComunaOpcion[];
  readonly usuarios: readonly ReporteConsolidadoUsuarioOpcion[];
}

export interface ReporteConsolidadoFiltros {
  readonly desde: string;
  readonly hasta: string;
  readonly reunionId?: number;
  readonly alcance: ReporteConsolidadoAlcance;
  readonly estado?: ReporteConsolidadoEstado;
  readonly usuarioAsignadoId?: number;
  readonly usuarioReportaId?: number;
  readonly sinAsignar?: boolean;
  readonly comunaId?: number;
  readonly origenCafeConJesus?: boolean;
  readonly hitoTresSemanasCumplido?: boolean;
  readonly conGdc?: boolean;
  readonly texto?: string;
}

export interface ReporteConsolidadoConsulta extends ReporteConsolidadoFiltros {
  readonly page: number;
  readonly size: number;
}
