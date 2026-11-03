import { parametrosReporteConsolidacionEspecial } from './reporte-consolidacion-especial.service';

describe('parametrosReporteConsolidacionEspecial', () => {
  it('incluye filtros comunes sin valores vacíos', () => {
    const params = parametrosReporteConsolidacionEspecial({
      desde: '2026-10-01',
      hasta: '2026-10-31',
      reunionId: 4,
      usuarioAsignadoId: 8,
    }, 'seguimiento');

    expect(params.get('desde')).toBe('2026-10-01');
    expect(params.get('reunionId')).toBe('4');
    expect(params.has('tipoCierre')).toBeFalse();
  });

  it('envía filtros de cierre solamente al histórico', () => {
    const filtros = {
      desde: '2026-10-01',
      hasta: '2026-10-31',
      tipoCierre: 'GDC' as const,
      motivo: 'contacto',
      gdc: 'Norte',
    };

    expect(parametrosReporteConsolidacionEspecial(filtros, 'historico').get('tipoCierre')).toBe('GDC');
    expect(parametrosReporteConsolidacionEspecial(filtros, 'ejecutivo').has('tipoCierre')).toBeFalse();
  });
});
