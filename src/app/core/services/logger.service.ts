import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  httpError(operation: string, error: unknown): void {
    if (environment.production) return;

    console.error('[Frontend HTTP]', {
      operation: this.safeOperation(operation),
      status: error instanceof HttpErrorResponse ? error.status : null,
    });
  }

  operationError(operation: string): void {
    if (environment.production) return;
    console.error('[Frontend]', { operation: this.safeOperation(operation) });
  }

  private safeOperation(operation: string): string {
    const normalized = operation.trim().toLowerCase();
    return /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(normalized) && normalized.length <= 80
      ? normalized
      : 'unknown-operation';
  }
}
