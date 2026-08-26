import {
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
