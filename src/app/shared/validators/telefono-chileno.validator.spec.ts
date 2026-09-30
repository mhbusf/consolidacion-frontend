import { FormControl } from '@angular/forms';
import { TelefonoChilenoValidator } from './telefono-chileno.validator';

describe('TelefonoChilenoValidator.validarConCodigoPais', () => {
  const validator = TelefonoChilenoValidator.validarConCodigoPais();

  it('acepta once dígitos con código de país', () => {
    expect(validator(new FormControl('56912345678'))).toBeNull();
    expect(validator(new FormControl('+56 9 1234 5678'))).toBeNull();
  });

  it('rechaza un número local de nueve dígitos', () => {
    expect(validator(new FormControl('912345678'))).toEqual({ telefonoChileno11Digitos: true });
  });

  it('rechaza letras y códigos de país inválidos', () => {
    expect(validator(new FormControl('5691234567a'))).toEqual({ telefonoChileno11Digitos: true });
    expect(validator(new FormControl('57912345678'))).toEqual({ telefonoChileno11Digitos: true });
  });
});
