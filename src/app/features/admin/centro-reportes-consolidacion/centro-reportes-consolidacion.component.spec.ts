import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, TimeoutError } from 'rxjs';
import { ReporteConsolidacionEspecialService } from '../../../core/services/reporte-consolidacion-especial.service';
import { ReporteConsolidadoService } from '../../../core/services/reporte-consolidado.service';
import { CentroReportesConsolidacionComponent } from './centro-reportes-consolidacion.component';

describe('CentroReportesConsolidacionComponent', () => {
  let fixture: ComponentFixture<CentroReportesConsolidacionComponent>;
  let reportesService: jasmine.SpyObj<ReporteConsolidacionEspecialService>;
  let consolidadoService: jasmine.SpyObj<ReporteConsolidadoService>;

  beforeEach(async () => {
    reportesService = jasmine.createSpyObj<ReporteConsolidacionEspecialService>(
      'ReporteConsolidacionEspecialService', ['metadata', 'preview', 'descargar']);
    consolidadoService = jasmine.createSpyObj<ReporteConsolidadoService>(
      'ReporteConsolidadoService', ['obtenerOpciones']);
    reportesService.metadata.and.returnValue(throwError(() => new TimeoutError()));
    consolidadoService.obtenerOpciones.and.returnValue(of({ reuniones: [], comunas: [], usuarios: [] }));

    await TestBed.configureTestingModule({
      imports: [CentroReportesConsolidacionComponent],
      providers: [
        provideRouter([]),
        { provide: ReporteConsolidacionEspecialService, useValue: reportesService },
        { provide: ReporteConsolidadoService, useValue: consolidadoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CentroReportesConsolidacionComponent);
    fixture.detectChanges();
  });

  it('abandona el spinner y permite reintentar cuando los filtros agotan el tiempo', () => {
    expect(fixture.componentInstance.cargandoInicial).toBeFalse();
    expect(fixture.nativeElement.querySelector('.spinner')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('El servidor tardó demasiado');

    fixture.nativeElement.querySelector('.state.error button').click();

    expect(reportesService.metadata).toHaveBeenCalledTimes(2);
  });
});
