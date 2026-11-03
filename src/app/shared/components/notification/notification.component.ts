import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  Notification,
  NotificationService,
  NotificationSeverity,
} from '../../../core/services/notification.service';

interface NotificationTimer {
  timeoutId: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
  paused: boolean;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [],
  template: `
    <section class="notification-container" aria-label="Notificaciones">
      @for (notification of notifications(); track notification.id) {
        <article
          class="notification notification-{{ notification.severity }}"
          [attr.role]="notification.severity === 'error' ? 'alert' : 'status'"
          [attr.aria-live]="notification.severity === 'error' ? 'assertive' : 'polite'"
          aria-atomic="true"
          [attr.aria-labelledby]="'notification-title-' + notification.id"
          [attr.aria-describedby]="notification.detail ? 'notification-detail-' + notification.id : null"
          (mouseenter)="pause(notification.id)"
          (mouseleave)="resume(notification, $event.currentTarget)"
          (focusin)="pause(notification.id)"
          (focusout)="resume(notification, $event.currentTarget)">
          <span class="icon" aria-hidden="true">{{ getIcon(notification.severity) }}</span>
          <span class="content">
            <strong [id]="'notification-title-' + notification.id">{{ notification.title }}</strong>
            @if (notification.detail) {
              <span class="detail" [id]="'notification-detail-' + notification.id">{{ notification.detail }}</span>
            }
            @if (notification.action) {
              <button type="button" class="action" (click)="runAction(notification)">
                {{ notification.action.label }}
              </button>
            }
          </span>
          <button
            type="button"
            class="close"
            [attr.aria-label]="'Cerrar notificación: ' + notification.title"
            (click)="dismiss(notification.id)">×</button>
        </article>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .notification-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: grid;
      width: min(430px, calc(100vw - 40px));
      gap: 12px;
      pointer-events: none;
    }

    .notification {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      box-sizing: border-box;
      width: 100%;
      padding: 16px;
      border-radius: 10px;
      color: white;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.3s ease-out;
      pointer-events: auto;
    }

    @keyframes slideIn {
      from { transform: translateX(32px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .notification-success { background: #18763a; }
    .notification-error { background: #b4232d; }
    .notification-info { background: #12677a; }
    .notification-warning { background: #f4c430; color: #242424; }

    .icon {
      flex: 0 0 auto;
      font-size: 20px;
      font-weight: 800;
      line-height: 1.3;
    }

    .content {
      display: grid;
      flex: 1;
      min-width: 0;
      gap: 4px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .content strong { font-size: 15px; }
    .detail { font-size: 14px; }

    .action {
      justify-self: start;
      margin-top: 6px;
      padding: 0;
      border: 0;
      border-bottom: 1px solid currentColor;
      color: inherit;
      background: transparent;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }

    .close {
      display: grid;
      flex: 0 0 32px;
      place-items: center;
      width: 32px;
      height: 32px;
      margin: -6px -6px 0 0;
      padding: 0;
      border: none;
      border-radius: 6px;
      color: inherit;
      background: transparent;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      opacity: 0.82;
    }

    .close:hover,
    .close:focus-visible,
    .action:hover,
    .action:focus-visible { opacity: 1; }

    .close:focus-visible,
    .action:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }

    @media (max-width: 640px) {
      .notification-container {
        top: 12px;
        right: 12px;
        left: 12px;
        width: auto;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .notification { animation: none; }
    }
  `],
})
export class NotificationComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly timers = new Map<number, NotificationTimer>();
  readonly notifications = signal<readonly Notification[]>([]);

  constructor(private readonly notificationService: NotificationService) {}

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.clearTimers());
    this.notificationService.notifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(notifications => {
        this.notifications.set(notifications);
        this.syncTimers(notifications);
      });
  }

  getIcon(severity: NotificationSeverity): string {
    switch (severity) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '!';
      case 'info': return 'i';
    }
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.notificationService.dismiss(id);
  }

  runAction(notification: Notification): void {
    try {
      notification.action?.callback();
    } finally {
      this.dismiss(notification.id);
    }
  }

  pause(id: number): void {
    const timer = this.timers.get(id);
    if (!timer) return;
    clearTimeout(timer.timeoutId);
    timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
    timer.paused = true;
  }

  resume(notification: Notification, currentTarget: EventTarget | null): void {
    const element = currentTarget as HTMLElement | null;
    if (element?.matches(':hover, :focus-within')) return;

    const timer = this.timers.get(notification.id);
    if (!timer || !timer.paused) {
      if (!timer && notification.duration !== null) this.startTimer(notification, notification.duration);
      return;
    }
    this.startTimer(notification, timer.remaining);
  }

  private syncTimers(notifications: readonly Notification[]): void {
    const visibleIds = new Set(notifications.map(notification => notification.id));
    for (const id of this.timers.keys()) {
      if (!visibleIds.has(id)) this.clearTimer(id);
    }

    for (const notification of notifications) {
      if (notification.duration !== null && !this.timers.has(notification.id)) {
        this.startTimer(notification, notification.duration);
      }
    }
  }

  private startTimer(notification: Notification, duration: number): void {
    const existing = this.timers.get(notification.id);
    if (existing) clearTimeout(existing.timeoutId);
    if (duration <= 0) {
      this.dismiss(notification.id);
      return;
    }

    const timer: NotificationTimer = {
      remaining: duration,
      startedAt: Date.now(),
      timeoutId: setTimeout(() => this.dismiss(notification.id), duration),
      paused: false,
    };
    this.timers.set(notification.id, timer);
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer.timeoutId);
    this.timers.delete(id);
  }

  private clearTimers(): void {
    for (const id of this.timers.keys()) this.clearTimer(id);
  }
}
