import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cancela una carga del dashboard que excede 15 segundos', fakeAsync(() => {
    let receivedError: unknown;
    service.getDashboard().subscribe({ error: error => { receivedError = error; } });
    const request = http.expectOne(api);

    tick(15_001);

    expect(receivedError).toBeInstanceOf(TimeoutError);
    expect(request.cancelled).toBeTrue();
  }));
});
