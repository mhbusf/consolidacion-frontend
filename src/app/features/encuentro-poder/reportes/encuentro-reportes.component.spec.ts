import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { EncuentroCiclo, EncuentroDashboard } from '../../../core/models/encuentro-poder.model';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';
import { EncuentroReportesComponent } from './encuentro-reportes.component';

const clases = [
  { id: 11, nombre: 'Clase 1', orden: 1, fecha: '2026-10-01', obligatoria: true, publicToken: 'c1', estado: 'FINALIZADA' as const },
  { id: 12, nombre: 'Clase 2', orden: 2, fecha: '2026-10-08', obligatoria: true, publicToken: 'c2', estado: 'EN_CURSO' as const },
  { id: 13, nombre: 'Clase 3', orden: 3, fecha: '2026-10-15', obligatoria: true, publicToken: 'c3', estado: 'PROGRAMADA' as const },
];

const ciclo: EncuentroCiclo = {
  id: 7,
  nombre: 'Octubre 2026',
  fechaInicio: '2026-10-01',
  estado: 'ABIERTO',
  publicToken: 'ciclo-token',
  clases,
};

const graduate = {
  persona: { id: 1, nombreCompleto: 'Persona Graduada', telefono: '56911111111', comuna: 'Santiago' },
  inscrito: true,
  clasesCompletadas: 3,
  clasesFaltantes: [],
  estado: 'COMPLETO' as const,
  asistencias: clases.map((clase, index) => ({ id: index + 1, personaId: 1, claseId: clase.id, clase: clase.nombre, metodo: 'MANUAL', fechaHora: '2026-10-01T20:00:00' })),
};

const failed = {
  persona: { id: 2, nombreCompleto: 'Persona Ausente', telefono: '56922222222', comuna: 'Maipú' },
  inscrito: true,
  clasesCompletadas: 0,
  clasesFaltantes: ['Clase 1', 'Clase 2', 'Clase 3'],
  estado: 'PENDIENTE' as const,
  asistencias: [],
};

const inProgress = {
  persona: { id: 3, nombreCompleto: 'Persona en Proceso', telefono: '56933333333', comuna: 'Ñuñoa' },
  inscrito: true,
  clasesCompletadas: 1,
  clasesFaltantes: ['Clase 2', 'Clase 3'],
  estado: 'PENDIENTE' as const,
  asistencias: [{ id: 5, personaId: 3, claseId: 11, clase: 'Clase 1', metodo: 'QR', fechaHora: '2026-10-01T20:00:00' }],
};

function dashboard(): EncuentroDashboard {
  return {
    ciclo,
    inscritos: 3,
    conAsistencia: 2,
    completos: 1,
    pendientes: 2,
    clases: clases.map(clase => ({
      claseId: clase.id,
      nombre: clase.nombre,
      fecha: clase.fecha,
      presentes: clase.id === 11 ? 2 : clase.id === 12 ? 1 : 0,
      inscritos: 3,
      ausentes: clase.id === 11 ? 1 : 0,
      estado: clase.estado,
    })),
    participantes: [graduate, failed, inProgress],
    graduados: [graduate],
  };
}

describe('EncuentroReportesComponent', () => {
  let fixture: ComponentFixture<EncuentroReportesComponent>;
  let component: EncuentroReportesComponent;
  let service: jasmine.SpyObj<EncuentroPoderService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroPoderService>('EncuentroPoderService', [
      'ciclos', 'dashboard', 'exportarReporte',
    ]);
    service.ciclos.and.returnValue(of([{ ...ciclo, clases: [] }]));
    service.dashboard.and.returnValue(of(dashboard()));
    service.exportarReporte.and.returnValue(of(new Blob()));

    await TestBed.configureTestingModule({
      imports: [EncuentroReportesComponent],
      providers: [{ provide: EncuentroPoderService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(EncuentroReportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra totales, asistencia y resultados separados por situación', () => {
    const text = fixture.nativeElement.textContent;

    expect(service.dashboard).toHaveBeenCalledOnceWith(7);
    expect(text).toContain('Números totales');
    expect(text).toContain('Asistencia por clase');
    expect(text).toContain('Persona Ausente');
    expect(text).toContain('Clase 1');
    expect(text).toContain('Persona Graduada');
    expect(component.noCumplen().map(persona => persona.persona.id)).toEqual([2]);
    expect(component.enProceso().map(persona => persona.persona.id)).toEqual([3]);
  });

  it('solicita el Excel correspondiente y bloquea descargas simultáneas', () => {
    const pendiente = new Subject<Blob>();
    service.exportarReporte.and.returnValue(pendiente);

    component.exportar('ASISTENCIA');
    component.exportar('GRADUACION');

    expect(service.exportarReporte).toHaveBeenCalledOnceWith(7, 'ASISTENCIA');
    expect(component.exportando()).toBe('ASISTENCIA');
  });

  it('permite reintentar cuando falla la carga inicial de ciclos', () => {
    fixture.destroy();
    service.ciclos.calls.reset();
    service.ciclos.and.returnValue(throwError(() => new Error('sin conexión')));
    const failedFixture = TestBed.createComponent(EncuentroReportesComponent);
    failedFixture.detectChanges();

    expect(failedFixture.componentInstance.accionError()).toBe('CICLOS');
    expect(failedFixture.nativeElement.querySelector('.alert button')).not.toBeNull();

    service.ciclos.and.returnValue(of([{ ...ciclo, clases: [] }]));
    (failedFixture.nativeElement.querySelector('.alert button') as HTMLButtonElement).click();
    failedFixture.detectChanges();

    expect(service.ciclos).toHaveBeenCalledTimes(2);
    expect(failedFixture.componentInstance.dashboard()?.ciclo.id).toBe(7);
    failedFixture.destroy();
  });

  it('ignora el error de una exportación iniciada en otro ciclo', () => {
    const pendiente = new Subject<Blob>();
    service.exportarReporte.and.returnValue(pendiente);
    component.exportar('RESUMEN');

    component.seleccionarCiclo({ target: { value: '8' } } as unknown as Event);
    pendiente.error(new Error('falló exportación anterior'));

    expect(component.error()).toBe('');
    expect(component.exportando()).toBeNull();
  });
});
