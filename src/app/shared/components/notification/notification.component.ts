import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div 
        *ngIf="message" 
        [class]="'notification notification-' + type"
        [@slideIn]>
        <span class="icon">{{ getIcon() }}</span>
        <span class="message">{{ message }}</span>
        <button class="close" (click)="close()">×</button>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
    }

    .notification {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 8px;
      color: white;
      min-width: 300px;
      max-width: 500px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification-success {
      background: #28a745;
    }

    .notification-error {
      background: #dc3545;
    }

    .notification-info {
      background: #17a2b8;
    }

    .notification-warning {
      background: #ffc107;
      color: #333;
    }

    .icon {
      font-size: 20px;
      font-weight: bold;
    }

    .message {
      flex: 1;
    }

    .close {
      background: none;
      border: none;
      color: inherit;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
    }

    .close:hover {
      opacity: 1;
    }
  `]
})
export class NotificationComponent implements OnInit {
  message = '';
  type: 'success' | 'error' | 'info' | 'warning' = 'info';
  private timeoutId: any;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notification$.subscribe(notification => {
      this.message = notification.message;
      this.type = notification.type;

      // Limpiar timeout anterior si existe
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      // Auto-ocultar después de 4 segundos
      this.timeoutId = setTimeout(() => {
        this.close();
      }, 4000);
    });
  }

  getIcon(): string {
    switch (this.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  }

  close() {
    this.message = '';
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}