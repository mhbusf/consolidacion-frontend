import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { EncuentroAsistencia, EncuentroCiclo, EncuentroDashboard } from '../../../core/models/encuentro-poder.model';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';
import { EncuentroDashboardComponent } from './encuentro-dashboard.component';

const clases = [
  { id: 10, nombre: 'Clase 0 - Informativa', orden: 0, fecha: '2026-10-01', obligatoria: false, publicToken: 'c0', estado: 'FINALIZADA' as const },
  { id: 11, nombre: 'Clase 1', orden: 1, fecha: '2026-10-08', obligatoria: true, publicToken: 'c1', estado: 'FINALIZADA' as const },
  { id: 12, nombre: 'Clase 2', orden: 2, fecha: '2026-10-15', obligatoria: true, publicToken: 'c2', estado: 'EN_CURSO' as const },
  { id: 13, nombre: 'Clase 3', orden: 3, fecha: '2026-10-22', obligatoria: true, publicToken: 'c3', estado: 'PROGRAMADA' as const },
];

const ciclo: EncuentroCiclo = {
  id: 1,
  nombre: 'Octubre 2026',
  fechaInicio: '2026-10-01',
  estado: 'ABIERTO',
  publicToken: 'ciclo-token',
  clases,
};

function dashboard(): EncuentroDashboard {
  return {
    ciclo,
    inscritos: 1,
    conAsistencia: 0,
    completos: 0,
    pendientes: 1,
    clases: clases.map(clase => ({
      claseId: clase.id,
      nombre: clase.nombre,
      fecha: clase.fecha,
      presentes: 0,
      inscritos: 1,
      ausentes: clase.id === 11 ? 1 : 0,
      estado: clase.estado,
    })),
    participantes: [{
      persona: { id: 21, nombreCompleto: 'Persona Prueba', telefono: '+56912345678', comuna: 'Santiago' },
      inscrito: true,
      clasesCompletadas: 0,
      clasesFaltantes: ['Clase 1', 'Clase 2', 'Clase 3'],
      estado: 'PENDIENTE',
      asistencias: [],
    }],
    graduados: [],
  };
}

describe('EncuentroDashboardComponent', () => {
  let fixture: ComponentFixture<EncuentroDashboardComponent>;
  let component: EncuentroDashboardComponent;
  let service: jasmine.SpyObj<EncuentroPoderService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroPoderService>('EncuentroPoderService', [
      'ciclos', 'dashboard', 'registrarAsistencia', 'historial', 'exportar', 'importar',
    ]);
    service.ciclos.and.returnValue(of([{ ...ciclo, clases: [] }]));
    service.dashboard.and.callFake(() => of(dashboard()));

    await TestBed.configureTestingModule({
      imports: [EncuentroDashboardComponent],
      providers: [provideRouter([]), { provide: EncuentroPoderService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(EncuentroDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra una respuesta asíncrona sin necesitar otro clic', async () => {
    const respuesta = new Subject<EncuentroDashboard>();
    service.dashboard.and.returnValue(respuesta);
    fixture.autoDetectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('.toolbar select');
    select.value = '1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    respuesta.next(dashboard());
    respuesta.complete();
    await fixture.whenStable();

    expect(service.dashboard).toHaveBeenCalledOnceWith(1);
    expect(component.dashboard()?.ciclo.id).toBe(1);
    expect(component.claseSeleccionada()).toBe(12);
    expect(fixture.nativeElement.textContent).toContain('Persona Prueba');
    expect(fixture.nativeElement.textContent).toContain('Copiar enlace de asistencia');
    expect(fixture.nativeElement.querySelector('.attendance-actions')?.textContent).toContain('Copiar link de autoasistencia');
    expect(fixture.nativeElement.textContent).toContain('1 ausente');
    expect(fixture.nativeElement.querySelector('.absence-cell')?.textContent).toContain('Clase 1');
  });

  it('muestra una estrella junto al nombre solo cuando la persona está graduada', () => {
    expect(fixture.nativeElement.querySelector('.attendee .graduate-star')).toBeNull();
    const data = dashboard();
    const graduado = {
      ...data.participantes[0],
      clasesCompletadas: 3,
      clasesFaltantes: [],
      estado: 'COMPLETO' as const,
    };
    component.dashboard.set({ ...data, participantes: [graduado], graduados: [graduado] });
    fixture.detectChanges();

    const estrella: HTMLElement = fixture.nativeElement.querySelector('.attendee .graduate-star');
    expect(estrella.textContent).toContain('★');
    expect(estrella.getAttribute('title')).toBe('Graduado');
  });

  it('actualiza la asistencia localmente sin volver a descargar el dashboard', () => {
    component.cicloSeleccionado.set(1);
    component.cargar();
    component.seleccionarClase(11);
    const asistencia: EncuentroAsistencia = {
      id: 31,
      personaId: 21,
      claseId: 11,
      clase: 'Clase 1',
      metodo: 'MANUAL',
      fechaHora: '2026-10-08T20:00:00',
    };
    service.registrarAsistencia.and.returnValue(of(asistencia));

    component.marcar(component.dashboard()!.participantes[0]);

    expect(service.registrarAsistencia).toHaveBeenCalledOnceWith(21, 11);
    expect(service.dashboard).toHaveBeenCalledTimes(1);
    expect(component.dashboard()?.conAsistencia).toBe(1);
    expect(component.dashboard()?.clases.find(clase => clase.claseId === 11)?.presentes).toBe(1);
    expect(component.dashboard()?.clases.find(clase => clase.claseId === 11)?.ausentes).toBe(0);
    expect(component.dashboard()?.participantes[0].clasesCompletadas).toBe(1);
  });

  it('conserva la clase elegida al actualizar el mismo ciclo', () => {
    component.cicloSeleccionado.set(1);
    component.cargar();
    component.seleccionarClase(12);

    component.cargar();

    expect(component.claseSeleccionada()).toBe(12);
  });

  it('no permite que una lectura antigua borre una asistencia confirmada', () => {
    component.cicloSeleccionado.set(1);
    component.cargar();
    component.seleccionarClase(11);
    const confirmacion = new Subject<EncuentroAsistencia>();
    service.registrarAsistencia.and.returnValue(confirmacion);
    component.marcar(component.dashboard()!.participantes[0]);
    const lecturaAntigua = new Subject<EncuentroDashboard>();
    service.dashboard.and.returnValue(lecturaAntigua);
    component.cargar();
    confirmacion.next({
      id: 32,
      personaId: 21,
      claseId: 11,
      clase: 'Clase 1',
      metodo: 'MANUAL',
      fechaHora: '2026-10-08T20:00:00',
    });
    confirmacion.complete();
    lecturaAntigua.next(dashboard());
    lecturaAntigua.complete();

    expect(component.dashboard()?.participantes[0].clasesCompletadas).toBe(1);
    expect(component.dashboard()?.clases.find(clase => clase.claseId === 11)?.presentes).toBe(1);
    expect(service.dashboard).toHaveBeenCalledTimes(3);
  });

  it('impide marcar anticipadamente una clase programada', () => {
    component.cicloSeleccionado.set(1);
    component.cargar();
    component.seleccionarClase(13);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.attendee .mark');
    expect(button.disabled).toBeTrue();
    expect(button.textContent).toContain('Aún no disponible');

    component.marcar(component.dashboard()!.participantes[0]);
    expect(service.registrarAsistencia).not.toHaveBeenCalled();
  });
});
