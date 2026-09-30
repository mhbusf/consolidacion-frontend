import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class TelefonoChilenoValidator {
  static validar(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.toString().replace(/\s/g, '');
      
      // Formatos válidos:
      // +56912345678
      // 56912345678
      // 912345678
      const regex = /^(\+?56)?[2-9]\d{8}$/;
      
      return regex.test(value) ? null : { telefonoInvalido: true };
    };
  }

  static validarConCodigoPais(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const original = control.value.toString().trim();
      const digitos = original.replace(/\D/g, '');
      const caracteresValidos = /^\+?[\d\s()-]+$/.test(original);
      return caracteresValidos && /^56[2-9]\d{8}$/.test(digitos)
        ? null
        : { telefonoChileno11Digitos: true };
    };
  }
}
