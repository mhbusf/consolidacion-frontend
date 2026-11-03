const INSTITUTIONAL_WHATSAPP_MESSAGE =
  'Hola {nombre}, te contactamos del equipo de Consolidación.';

export function institutionalWhatsAppMessage(nombre: string, consolidador = ''): string {
  return INSTITUTIONAL_WHATSAPP_MESSAGE
    .replace('{nombre}', nombre.trim())
    .replace('{consolidador}', consolidador.trim());
}
