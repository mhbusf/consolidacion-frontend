import { WhatsAppUrlPipe } from './whatsapp-url.pipe';

describe('WhatsAppUrlPipe', () => {
  const pipe = new WhatsAppUrlPipe();

  it('normaliza un teléfono chileno con código de país', () => {
    expect(pipe.transform('+56 9 1111 1111')).toBe('https://wa.me/56911111111');
  });

  it('agrega el código de país a un teléfono chileno de nueve dígitos', () => {
    expect(pipe.transform('9 1111 1111')).toBe('https://wa.me/56911111111');
  });

  it('rechaza números que no tienen un formato chileno válido', () => {
    expect(pipe.transform('12345')).toBeNull();
    expect(pipe.transform(null)).toBeNull();
  });
});
