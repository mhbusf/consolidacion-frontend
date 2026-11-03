import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface HttpErrorMessageOptions {
  fallback?: string;
  statusMessages?: Readonly<Record<number, string>>;
}

const CODE_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos.',
  ACCOUNT_LOCKED: 'Tu cuenta está bloqueada. Contacta a un administrador.',
  SESSION_EXPIRED: 'Tu sesión venció. Inicia sesión nuevamente para continuar.',
  VALIDATION_ERROR: 'Revisa los datos ingresados e intenta nuevamente.',
  DUPLICATE_RECORD: 'Ya existe un registro con esos datos.',
  RATE_LIMITED: 'Realizaste demasiados intentos. Espera un momento e intenta nuevamente.',
};

const STATUS_MESSAGES: Readonly<Record<number, string>> = {
  0: 'No se pudo conectar con el servidor. Verifica tu conexión.',
  400: 'Revisa los datos ingresados e intenta nuevamente.',
  401: 'Tu sesión no es válida. Inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No se encontró la información solicitada.',
  408: 'La solicitud tardó demasiado. Intenta nuevamente.',
  409: 'La operación no pudo completarse porque existe un conflicto con los datos actuales.',
  422: 'Revisa los datos ingresados e intenta nuevamente.',
  423: 'Tu cuenta está bloqueada. Contacta a un administrador.',
  429: 'Realizaste demasiados intentos. Espera un momento e intenta nuevamente.',
  500: 'Ocurrió un error en el servidor. Intenta nuevamente.',
  502: 'El servicio no está disponible temporalmente. Intenta nuevamente.',
  503: 'El servicio no está disponible temporalmente. Intenta nuevamente.',
  504: 'El servidor tardó demasiado en responder. Intenta nuevamente.',
};

@Injectable({ providedIn: 'root' })
export class HttpErrorMapperService {
  message(error: unknown, options: HttpErrorMessageOptions = {}): string {
    const knownCode = this.knownCode(error);
    if (knownCode) return CODE_MESSAGES[knownCode];

    const status = error instanceof HttpErrorResponse ? error.status : null;
    if (status !== null) {
      const override = options.statusMessages?.[status];
      if (override) return override;
      const statusMessage = STATUS_MESSAGES[status];
      if (statusMessage) return statusMessage;
    }

    return options.fallback ?? 'No pudimos completar la acción. Intenta nuevamente.';
  }

  private knownCode(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) return null;
    const body = this.objectBody(error.error);
    if (!body) return null;

    const value = body['code'] ?? body['errorCode'] ?? body['codigo'];
    return typeof value === 'string' && CODE_MESSAGES[value] ? value : null;
  }

  private objectBody(body: unknown): Record<string, unknown> | null {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    if (typeof body !== 'string' || body.length > 1000) return null;
    try {
      const parsed: unknown = JSON.parse(body);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }
}
