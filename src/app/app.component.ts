import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { NotificationComponent } from './shared/components/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, NotificationComponent],
  template: `
    <app-notification></app-notification>
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: padding-left 0.2s ease;
    }
  `]
})
export class AppComponent {
  title = 'consolidacion-frontend';
}
