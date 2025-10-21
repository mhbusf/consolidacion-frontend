export interface Comentario {
  id?: number;
  contenido: string;
  username?: string;
  fechaCreacion?: string;
  tipo?: TipoComentario;
  esObligatorio?: boolean;
  numeroSemana?: number;
}

export enum TipoComentario {
  REGULAR = 'REGULAR',
  DIA_1 = 'DIA_1',
  DIA_2 = 'DIA_2',
  DIA_3 = 'DIA_3',
  SEMANAL = 'SEMANAL',
  CIERRE = 'CIERRE'
}

// Para crear un comentario
export interface ComentarioRequest {
  contenido: string;
}

// Respuesta del backend
export interface ComentarioResponse {
  id: number;
  contenido: string;
  username: string;
  fechaCreacion: string;
  tipo?: TipoComentario;
  esObligatorio?: boolean;
  numeroSemana?: number;
}