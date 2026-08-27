export type ReporteCafeEstado = 'ACTIVO' | 'CONVERTIDO' | 'ARCHIVADO';

export interface ReporteCafeUltimoComentario {
  readonly contenido: string | null;
  readonly usuario: string | null;
  readonly fechaCreacion: string | null;
}

export interface ReporteCafeRegistro {
  readonly id: number;
  readonly nombre: string | null;
  readonly apellido: string | null;
  readonly nombreCompleto: string | null;
  readonly telefono: string | null;
  readonly fechaIngreso: string | null;
  readonly reunionNombre: string | null;
  readonly etapa: string | null;
  readonly estado: ReporteCafeEstado | null;
  readonly estadoDescripcion: string | null;
  readonly registradoPor: string | null;
  readonly usuarioAsignado: string | null;
  readonly asistio: boolean | null;
  readonly fechaAsistencia: string | null;
  readonly aceptoAlSenor: boolean | null;
  readonly ultimoComentario: ReporteCafeUltimoComentario | null;
}

export interface ReporteCafePagina {
  readonly content: readonly ReporteCafeRegistro[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly first: boolean;
  readonly last: boolean;
}

export interface ReporteCafeOpcion {
  readonly id: number;
  readonly nombre: string | null;
  readonly username?: string | null;
  readonly nombreCompleto?: string | null;
}

export interface ReporteCafeOpciones {
  readonly reuniones: readonly ReporteCafeOpcion[];
  readonly usuarios: readonly ReporteCafeOpcion[];
}

export interface ReporteCafeFiltros {
  readonly desde: string;
  readonly hasta: string;
  readonly reunionId?: number;
  readonly estado?: ReporteCafeEstado;
  readonly etapa?: string;
  readonly usuarioAsignadoId?: number;
  readonly registradoPorId?: number;
  readonly sinAsignar?: boolean;
  readonly asistio?: boolean;
  readonly aceptoAlSenor?: boolean;
  readonly convertidoAConsolidado?: boolean;
  readonly archivado?: boolean;
  readonly texto?: string;
}

export interface ReporteCafeConsulta extends ReporteCafeFiltros {
  readonly page: number;
  readonly size: number;
}
