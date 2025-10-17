export interface ComentarioRequest {
  contenido: string;
}

export interface ComentarioResponse {
  id: number;
  contenido: string;
  usuario: string;
  fechaCreacion: string;
}