import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EncuentroDashboard } from '../../../core/models/encuentro-poder.model';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';
import { EncuentroGraduacionComponent } from './encuentro-graduacion.component';

describe('EncuentroGraduacionComponent', () => {
  let fixture: ComponentFixture<EncuentroGraduacionComponent>;
  let component: EncuentroGraduacionComponent;
  let service: jasmine.SpyObj<EncuentroPoderService>;

  const pendiente = {
    persona: { id: 1, nombreCompleto: 'Ana Pendiente', telefono: '56911111111', comuna: 'Santiago' },
    inscrito: true,
    clasesCompletadas: 1,
    clasesFaltantes: ['Clase 2', 'Clase 3'],
    estado: 'PENDIENTE' as const,
    asistencias: [],
  };
  const graduado = {
    ...pendiente,
    persona: { ...pendiente.persona, id: 2, nombreCompleto: 'Berta Graduada' },
    clasesCompletadas: 3,
    clasesFaltantes: [],
    estado: 'COMPLETO' as const,
  };
  const dashboard: EncuentroDashboard = {
    ciclo: {
      id: 7,
      nombre: 'Octubre 2026',
      fechaInicio: '2026-10-01',
      estado: 'ABIERTO',
      publicToken: 'ciclo',
      clases: [
        { id: 10, nombre: 'Clase 0', orden: 0, fecha: '2026-10-01', obligatoria: false, publicToken: 'c0', estado: 'FINALIZADA' },
        { id: 11, nombre: 'Clase 1', orden: 1, fecha: '2026-10-08', obligatoria: true, publicToken: 'c1', estado: 'FINALIZADA' },
        { id: 12, nombre: 'Clase 2', orden: 2, fecha: '2026-10-15', obligatoria: true, publicToken: 'c2', estado: 'FINALIZADA' },
        { id: 13, nombre: 'Clase 3', orden: 3, fecha: '2026-10-22', obligatoria: true, publicToken: 'c3', estado: 'FINALIZADA' },
      ],
    },
    inscritos: 2,
    activos: 2,
    noContinuaron: 0,
    conAsistencia: 2,
    completos: 1,
    pendientes: 1,
    clases: [],
    participantes: [pendiente, graduado],
    graduados: [graduado],
    historialNoContinuaron: [],
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroPoderService>('EncuentroPoderService', ['ciclos', 'dashboard', 'historial']);
    service.ciclos.and.returnValue(of([{ ...dashboard.ciclo, clases: [] }]));
    service.dashboard.and.returnValue(of(dashboard));

    await TestBed.configureTestingModule({
      imports: [EncuentroGraduacionComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ cicloId: '7' }) } } },
        { provide: EncuentroPoderService, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EncuentroGraduacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('abre el ciclo solicitado y muestra pendientes por defecto', () => {
    expect(service.dashboard).toHaveBeenCalledOnceWith(7);
    expect(component.totalObligatorias()).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Ana Pendiente');
    expect(fixture.nativeElement.textContent).not.toContain('Berta Graduada');
    expect(fixture.nativeElement.textContent).toContain('1 / 3');
  });

  it('permite alternar a graduados sin considerar clase 0 en el total obligatorio', () => {
    component.seleccionarEstado('COMPLETO');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Berta Graduada');
    expect(fixture.nativeElement.textContent).not.toContain('Ana Pendiente');
    expect(fixture.nativeElement.textContent).toContain('3 / 3');
  });

  it('filtra y reinicia la paginación', () => {
    component.pagina.set(3);
    component.actualizarBusqueda('sin coincidencia');

    expect(component.pagina()).toBe(0);
    expect(component.participantes()).toEqual([]);
  });
});
