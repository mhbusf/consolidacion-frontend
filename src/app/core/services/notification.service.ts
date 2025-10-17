import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notification$ = this.notificationSubject.asObservable();

  success(message: string) {
    this.showNotification(message, 'success');
  }

  error(message: string) {
    this.showNotification(message, 'error');
  }

  info(message: string) {
    this.showNotification(message, 'info');
  }

  warning(message: string) {
    this.showNotification(message, 'warning');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.notificationSubject.next({ message, type });
  }
}