import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { Dashboard } from '../core/models/consolidado.model';
import { AuthService } from '../core/services/auth.service';
import { DashboardService } from '../core/services/dashboard.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let dashboardResponse: Subject<Dashboard>;

  const dashboard: Dashboard = {
    totalConsolidados: 18,
    consolidadosEnProceso: 7,
    consolidadosConGDC: 3,
    consolidadosCerrados: 2,
    consolidadosAlDia: 10,
    consolidadosAtrasados: 5,
    consolidadosSinAsignar: 4,
    totalCafeConJesus: 6,
    consolidadosConAtrasos: [{
      id: 11,
      titulo: 'Ana Pérez',
      fechaIngreso: '2026-10-01',
      asignadoA: 'consolidador',
      estado: 'EN_PROCESO',
      diasDeAtraso: 8,
      comentariosPendientes: [{ tipo: 'SEMANA_1', fechaEsperada: '2026-10-08', diasDeAtraso: 8 }],
    }],
    estadisticasPorUsuario: [{
      username: 'consolidador',
      email: 'consolidador@example.com',
      totalAsignados: 5,
      alDia: 4,
      conAtrasos: 1,
    }],
    estadisticasPorReunion: [{ nombreReunion: 'Reunión Centro', totalConsolidados: 18 }],
  };

  beforeEach(async () => {
    dashboardResponse = new Subject<Dashboard>();
    dashboardService = jasmine.createSpyObj<DashboardService>('DashboardService', [
      'getDashboard', 'getResumenConsolidador',
    ]);
    dashboardService.getDashboard.and.returnValue(dashboardResponse);
    dashboardService.getResumenConsolidador.and.returnValue(of({
      username: 'consolidador',
      totalCafes: 0,
      totalConsolidados: 0,
      cafes: [],
      consolidados: [],
    }));
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['getAllUsers']);
    authService.getAllUsers.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('muestra métricas de atención y acciones hacia rutas operativas', () => {
    dashboardResponse.next(dashboard);
    fixture.detectChanges();

    const overdue: HTMLAnchorElement = fixture.nativeElement.querySelector('[data-testid="attention-overdue"]');
    const unassigned: HTMLAnchorElement = fixture.nativeElement.querySelector('[data-testid="attention-unassigned"]');
    const active: HTMLAnchorElement = fixture.nativeElement.querySelector('[data-testid="attention-active"]');

    expect(overdue.textContent).toContain('5');
    expect(overdue.getAttribute('href')).toBe('/consolidados-atrasos');
    expect(unassigned.textContent).toContain('4');
    expect(unassigned.getAttribute('href')).toBe('/consolidados');
    expect(active.textContent).toContain('7');
    expect(active.getAttribute('href')).toBe('/consolidados');
  });

  it('distingue el error principal del estado vacío y permite reintentar', () => {
    dashboardResponse.error(new Error('network'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.state-error')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.state-empty')).toBeNull();

    fixture.nativeElement.querySelector('.state-error button').click();
    expect(dashboardService.getDashboard).toHaveBeenCalledTimes(2);
  });

  it('muestra un estado vacío real cuando la carga correcta no contiene registros', () => {
    dashboardResponse.next({
      ...dashboard,
      totalConsolidados: 0,
      consolidadosEnProceso: 0,
      consolidadosConGDC: 0,
      consolidadosCerrados: 0,
      consolidadosAlDia: 0,
      consolidadosAtrasados: 0,
      consolidadosSinAsignar: 0,
      totalCafeConJesus: 0,
      consolidadosConAtrasos: [],
      estadisticasPorUsuario: [],
      estadisticasPorReunion: [],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.state-empty')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.state-error')).toBeNull();
  });

  it('expone semántica accesible en la tabla de estado del equipo', () => {
    dashboardResponse.next(dashboard);
    fixture.detectChanges();

    const table: HTMLTableElement = fixture.nativeElement.querySelector('.team-table');
    const progress: HTMLElement = table.querySelector('[role="progressbar"]')!;

    expect(table.querySelector('caption')?.textContent).toContain('cumplimiento del equipo');
    expect(table.querySelectorAll('th[scope="col"]').length).toBe(6);
    expect(table.querySelector('tbody th[scope="row"]')?.textContent).toContain('consolidador');
    expect(progress.getAttribute('aria-valuenow')).toBe('80');
  });
});
