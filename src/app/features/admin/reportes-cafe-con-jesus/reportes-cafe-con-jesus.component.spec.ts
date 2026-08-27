import {
  crearFiltrosCafePredeterminados,
  crearNombreArchivoCafe,
  extraerNombreArchivoCafe,
  validarRangoCafe,
} from './reportes-cafe-con-jesus.component';

describe('Reporte Café con Jesús helpers', () => {
  it('crea el rango inicial del mes', () => {
    expect(crearFiltrosCafePredeterminados(new Date(2026, 7, 25))).toEqual({
      desde: '2026-08-01', hasta: '2026-08-25',
    });
  });

  it('valida fechas y rangos', () => {
    expect(validarRangoCafe('2026-02-30', '2026-03-01')).not.toBeNull();
    expect(validarRangoCafe('2026-08-02', '2026-08-01')).not.toBeNull();
    expect(validarRangoCafe('2026-08-01', '2026-08-31')).toBeNull();
  });

  it('extrae y sanea Content-Disposition', () => {
    expect(extraerNombreArchivoCafe("attachment; filename*=UTF-8''cafe%20jesus.xlsx", 'a.xlsx'))
      .toBe('cafe jesus.xlsx');
    expect(extraerNombreArchivoCafe('attachment; filename="../cafe.xlsx"', 'a.xlsx'))
      .toBe('cafe.xlsx');
  });

  it('genera el nombre por fecha', () => {
    expect(crearNombreArchivoCafe(new Date(2026, 7, 25))).toBe('reporte-cafe-con-jesus-2026-08-25.xlsx');
  });
});
