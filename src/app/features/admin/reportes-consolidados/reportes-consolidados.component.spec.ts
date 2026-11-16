import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReporteConsolidado } from '../../../core/models/reporte-consolidado.model';
import { ReporteConsolidadoService } from '../../../core/services/reporte-consolidado.service';
import {
  ReportesConsolidadosComponent,
  crearFiltrosPredeterminados,
  crearNombreArchivoPredeterminado,
  extraerNombreArchivoReporte,
  validarRangoFechas,
} from './reportes-consolidados.component';

describe('ReportesConsolidadosComponent helpers', () => {
  it('crea el rango inicial desde el primer día del mes hasta hoy', () => {
    expect(crearFiltrosPredeterminados(new Date(2026, 7, 25))).toEqual({
      desde: '2026-08-01',
      hasta: '2026-08-25',
      alcance: 'TODOS',
    });
  });

  it('valida fechas inválidas y rangos invertidos', () => {
    expect(validarRangoFechas('2026-02-30', '2026-03-01')).not.toBeNull();
    expect(validarRangoFechas('2026-08-02', '2026-08-01')).not.toBeNull();
    expect(validarRangoFechas('2026-08-01', '2026-08-31')).toBeNull();
  });

  it('extrae y sanea el nombre RFC 5987 del archivo', () => {
    expect(extraerNombreArchivoReporte(
      "attachment; filename*=UTF-8''reporte%20agosto.xlsx",
      'fallback.xlsx',
    )).toBe('reporte agosto.xlsx');
    expect(extraerNombreArchivoReporte(
      'attachment; filename="../reporte.xlsx"',
      'fallback.xlsx',
    )).toBe('reporte.xlsx');
  });

  it('genera un nombre de archivo estable', () => {
    expect(crearNombreArchivoPredeterminado(new Date(2026, 7, 25)))
      .toBe('reporte-consolidados-2026-08-25.xlsx');
  });
});

describe('ReportesConsolidadosComponent', () => {
  let fixture: ComponentFixture<ReportesConsolidadosComponent>;

  beforeEach(async () => {
    const service = jasmine.createSpyObj<ReporteConsolidadoService>(
      'ReporteConsolidadoService',
      ['obtenerOpciones', 'consultar', 'exportar'],
    );
    service.obtenerOpciones.and.returnValue(of({ reuniones: [], comunas: [], usuarios: [] }));
    service.consultar.and.returnValue(of({
      content: [{ id: 1, nombre: 'Ana', estado: 'ASIGNADO' } as ReporteConsolidado],
      page: 0,
      size: 25,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    }));

    await TestBed.configureTestingModule({
      imports: [ReportesConsolidadosComponent],
      providers: [{ provide: ReporteConsolidadoService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesConsolidadosComponent);
    fixture.detectChanges();
  });

  it('no muestra el filtro ni la columna del hito de tres semanas', () => {
    fixture.componentInstance.alternarFiltrosAvanzados();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#report-milestone')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('3 semanas');
    expect(fixture.nativeElement.textContent).not.toContain('Hito de tres semanas');
  });
});
