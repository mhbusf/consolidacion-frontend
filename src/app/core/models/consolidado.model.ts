export interface ConsolidadoRequest {
  nombre: string;
  telefono: string;
  edad: number;
  quienInvito: string;
  motivoOracion: string;
}

export interface ConsolidadoResponse {
  id: number;
  nombre: string;
  telefono: string;
  edad: number;
  quienInvito: string;
  motivoOracion: string;
  usuarioReporta: string;
  usuarioAsignado?: string;
  fechaIngreso: string;
}