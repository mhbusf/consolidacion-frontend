import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Dashboard } from '../../../core/models/consolidado.model';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ConsolidadosAtrasosComponent } from './consolidados-atrasos.component';

describe('ConsolidadosAtrasosComponent', () => {
  let fixture: ComponentFixture<ConsolidadosAtrasosComponent>;

  const dashboard: Dashboard = {
    totalConsolidados: 2,
    consolidadosEnProceso: 2,
    consolidadosConGDC: 0,
    consolidadosCerrados: 0,
    consolidadosAlDia: 0,
    consolidadosAtrasados: 2,
    consolidadosSinAsignar: 0,
    totalCafeConJesus: 0,
    estadisticasPorUsuario: [],
    estadisticasPorReunion: [],
    consolidadosConAtrasos: [
      {
        id: 1,
        titulo: 'Ana',
        telefono: '56911111111',
        fechaIngreso: '2026-10-01',
        asignadoA: 'consolidador',
        estado: 'EN_PROCESO',
        diasDeAtraso: 8,
        comentariosPendientes: [
          { tipo: 'DIA_2', fechaEsperada: '2026-10-03', diasDeAtraso: 8 },
          { tipo: 'SEMANAL' as 'DIA_1', fechaEsperada: '2026-10-08', diasDeAtraso: 3 },
          { tipo: 'OTRO' as 'DIA_1', fechaEsperada: '2026-10-09', diasDeAtraso: 2 },
        ],
      },
      {
        id: 2,
        titulo: 'Legado',
        telefono: '56922222222',
        fechaIngreso: '2026-10-01',
        asignadoA: 'consolidador',
        estado: 'EN_PROCESO',
        diasDeAtraso: 5,
        comentariosPendientes: [
          { tipo: 'SEMANA_1' as 'DIA_1', fechaEsperada: '2026-10-08', diasDeAtraso: 5 },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const service = jasmine.createSpyObj<DashboardService>('DashboardService', ['getDashboard']);
    service.getDashboard.and.returnValue(of(dashboard));

    await TestBed.configureTestingModule({
      imports: [ConsolidadosAtrasosComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsolidadosAtrasosComponent);
    fixture.detectChanges();
  });

  it('muestra solo seguimientos diarios con fecha esperada', () => {
    const text = fixture.nativeElement.textContent;

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    expect(text).toContain('Seguimiento día 2');
    expect(text).toContain('Esperado: 03/10/2026');
    expect(text).not.toContain('SEMANAL');
    expect(text).not.toContain('SEMANA_1');
    expect(text).not.toContain('OTRO');
    expect(text).not.toContain('Legado');
  });
});
