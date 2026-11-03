import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'whatsappUrl',
  standalone: true,
  pure: true,
})
export class WhatsAppUrlPipe implements PipeTransform {
  transform(telefono: string | null | undefined, mensaje?: string | null): string | null {
    const digitos = telefono?.replace(/\D/g, '') ?? '';
    const numero = /^[2-9]\d{8}$/.test(digitos) ? `56${digitos}` : digitos;

    if (!/^56[2-9]\d{8}$/.test(numero)) return null;

    const texto = mensaje?.trim();
    return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
  }
}
