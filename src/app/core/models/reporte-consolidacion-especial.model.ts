export type TipoReporteConsolidacionEspecial =
  | 'seguimiento'
  | 'cartera'
  | 'historico'
  | 'ejecutivo';

export interface ReporteConsolidacionEspecialFiltros {
  readonly desde: string;
  readonly hasta: string;
  readonly reunionId?: number;
  readonly usuarioAsignadoId?: number;
  readonly comunaId?: number;
  readonly tipoCierre?: 'GDC' | 'CERRADO';
  readonly motivo?: string;
  readonly gdc?: string;
}

export interface ReporteConsolidacionEspecialPreview {
  readonly registros: number;
  readonly maximoRegistros: number;
  readonly fechaAplicada: 'fecha_ingreso' | 'fecha_cierre';
  readonly definicion: string;
}

export interface ReporteConsolidacionEspecialMetadata {
  readonly maximoRegistros: number;
  readonly maximoDiasRango: number;
  readonly zonaHoraria: string;
  readonly definiciones: Readonly<Record<string, string>>;
}
