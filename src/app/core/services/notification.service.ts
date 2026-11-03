import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

export interface NotificationAction {
  label: string;
  callback: () => void;
}

export interface NotificationOptions {
  title?: string;
  detail?: string;
  duration?: number | null;
  action?: NotificationAction;
}

export interface NotificationRequest extends NotificationOptions {
  severity: NotificationSeverity;
  title: string;
}

export interface Notification {
  id: number;
  title: string;
  detail?: string;
  severity: NotificationSeverity;
  type: NotificationSeverity;
  duration: number | null;
  action?: NotificationAction;
}

const DEFAULT_DURATIONS: Record<NotificationSeverity, number | null> = {
  success: 4000,
  info: 5000,
  warning: 7000,
  error: null,
};

const DEFAULT_TITLES: Record<NotificationSeverity, string> = {
  success: 'Listo',
  info: 'Información',
  warning: 'Atención',
  error: 'No pudimos completar la acción',
};

export function notificationDuration(
  severity: NotificationSeverity,
  requestedDuration?: number | null,
): number | null {
  if (severity === 'error') return null;
  if (requestedDuration === null) return null;
  if (typeof requestedDuration === 'number') return Math.max(1000, requestedDuration);
  return DEFAULT_DURATIONS[severity];
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly maxVisible = 3;
  private readonly queue: Notification[] = [];
  private readonly notificationsSubject = new BehaviorSubject<readonly Notification[]>([]);
  private readonly notificationSubject = new Subject<Notification>();
  private nextId = 1;

  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly notification$ = this.notificationSubject.asObservable();

  success(message: string, options: NotificationOptions = {}): number {
    return this.enqueueLegacy(message, 'success', options);
  }

  error(message: string, options: NotificationOptions = {}): number {
    return this.enqueueLegacy(message, 'error', options);
  }

  info(message: string, options: NotificationOptions = {}): number {
    return this.enqueueLegacy(message, 'info', options);
  }

  warning(message: string, options: NotificationOptions = {}): number {
    return this.enqueueLegacy(message, 'warning', options);
  }

  show(request: NotificationRequest): number {
    const notification: Notification = {
      id: this.nextId++,
      title: request.title,
      detail: request.detail,
      severity: request.severity,
      type: request.severity,
      duration: notificationDuration(request.severity, request.duration),
      action: request.action,
    };

    this.queue.push(notification);
    this.notificationSubject.next(notification);
    this.emitVisible();
    return notification.id;
  }

  dismiss(id: number): void {
    const index = this.queue.findIndex(notification => notification.id === id);
    if (index === -1) return;
    this.queue.splice(index, 1);
    this.emitVisible();
  }

  clear(): void {
    this.queue.length = 0;
    this.emitVisible();
  }

  private enqueueLegacy(
    message: string,
    severity: NotificationSeverity,
    options: NotificationOptions,
  ): number {
    return this.show({
      severity,
      title: options.title ?? DEFAULT_TITLES[severity],
      detail: options.detail ?? message,
      duration: options.duration,
      action: options.action,
    });
  }

  private emitVisible(): void {
    this.notificationsSubject.next(this.queue.slice(0, this.maxVisible));
  }
}
