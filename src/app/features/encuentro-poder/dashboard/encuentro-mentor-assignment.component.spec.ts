import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { EncuentroAsignacionMentor } from '../../../core/models/encuentro-mentoria.model';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';
import { EncuentroMentorAssignmentComponent } from './encuentro-mentor-assignment.component';

describe('EncuentroMentorAssignmentComponent', () => {
  let fixture: ComponentFixture<EncuentroMentorAssignmentComponent>;
  let component: EncuentroMentorAssignmentComponent;
  let service: jasmine.SpyObj<EncuentroMentoriaService>;
  const mentor = { id: 9, username: 'mentor', nombreCompleto: 'Mentor Uno', email: 'mentor@example.com', enabled: true };
  const asignacion = {
    inscripcionId: 42,
    personaId: 10,
    nombreCompleto: 'Ana Pérez',
    telefono: '+56911111111',
    invitadoPor: 'Pedro Servidor',
    asistencias: [
      { claseId: 10, claseNombre: 'Clase 0 - Informativa', orden: 0, fecha: '2026-10-01', obligatoria: false, asistio: true },
      { claseId: 11, claseNombre: 'Clase 1', orden: 1, fecha: '2026-10-08', obligatoria: true, asistio: false },
    ],
    mentor: null,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroMentoriaService>('EncuentroMentoriaService', [
      'asignaciones', 'mentoresHabilitados', 'asignarMentor', 'desasignarMentor',
    ]);
    service.asignaciones.and.returnValue(of([asignacion]));
    service.mentoresHabilitados.and.returnValue(of([mentor]));
    service.asignarMentor.and.returnValue(of({ ...asignacion, mentor }));
    service.desasignarMentor.and.returnValue(of({ ...asignacion, mentor: null }));

    await TestBed.configureTestingModule({
      imports: [EncuentroMentorAssignmentComponent],
      providers: [{ provide: EncuentroMentoriaService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(EncuentroMentorAssignmentComponent);
    fixture.componentRef.setInput('cicloId', 7);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga participantes y mentores habilitados por ciclo', () => {
    expect(service.asignaciones).toHaveBeenCalledOnceWith(7);
    expect(service.mentoresHabilitados).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('Invitado por / servidor de GDC');
    expect(fixture.nativeElement.textContent).toContain('Pedro Servidor');
    expect(fixture.nativeElement.textContent).toContain('C0✓');
    expect(fixture.nativeElement.textContent).toContain('C1—');
    expect(fixture.nativeElement.textContent).toContain('Sin mentor');
    expect(fixture.nativeElement.textContent).toContain('Mentor Uno');
  });

  it('incluye etiquetas para representar cada asignación como tarjeta en móvil', () => {
    const cells = fixture.nativeElement.querySelectorAll('tbody td[data-label]') as NodeListOf<Element>;
    const labels = Array.from(cells).map(cell => cell.getAttribute('data-label'));

    expect(labels).toContain('Participante');
    expect(labels).toContain('Teléfono');
    expect(labels).toContain('Mentor actual');
    expect(labels).toContain('Asignar mentor');
  });

  it('muestra la cantidad asignada a cada mentor y la actualiza con los cambios', () => {
    expect(component.resumenMentores()).toEqual([{ mentor, cantidad: 0 }]);

    component.cambiarMentor(asignacion, '9');
    expect(component.resumenMentores()).toEqual([{ mentor, cantidad: 1 }]);

    component.cambiarMentor(component.asignaciones()[0], '');
    expect(component.resumenMentores()).toEqual([{ mentor, cantidad: 0 }]);
  });

  it('asigna y desasigna usando la inscripción del ciclo', () => {
    component.cambiarMentor(asignacion, '9');

    expect(service.asignarMentor).toHaveBeenCalledOnceWith(42, 9);
    expect(component.asignaciones()[0].mentor?.id).toBe(9);

    component.cambiarMentor(component.asignaciones()[0], '');
    expect(service.desasignarMentor).toHaveBeenCalledOnceWith(42);
    expect(component.asignaciones()[0].mentor).toBeNull();
  });

  it('filtra participantes sin mentor y por mentor', () => {
    component.filtro.set('SIN_MENTOR');
    expect(component.asignacionesFiltradas().length).toBe(1);

    component.filtro.set('9');
    expect(component.asignacionesFiltradas().length).toBe(0);
  });

  it('busca participantes por nombre o teléfono y combina la búsqueda con el mentor', () => {
    component.busqueda.set('ana pérez');
    expect(component.asignacionesFiltradas()).toEqual([asignacion]);

    component.busqueda.set('11111111');
    expect(component.asignacionesFiltradas()).toEqual([asignacion]);

    component.filtro.set('9');
    expect(component.asignacionesFiltradas()).toEqual([]);

    component.filtro.set('TODOS');
    component.busqueda.set('persona inexistente');
    expect(component.asignacionesFiltradas()).toEqual([]);
  });

  it('renderiza como máximo 25 asignaciones y reinicia la página al filtrar', () => {
    component.asignaciones.set(Array.from({ length: 26 }, (_, index) => ({
      ...asignacion,
      inscripcionId: index + 1,
      personaId: index + 1,
      nombreCompleto: `Participante ${index + 1}`,
    })));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(25);
    component.cambiarPagina(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Participante 26');

    component.actualizarBusqueda('Participante 1');
    expect(component.pagina()).toBe(0);
  });

  it('conserva datos recién recargados al completar una asignación anterior', () => {
    const respuesta = new Subject<EncuentroAsignacionMentor>();
    service.asignarMentor.and.returnValue(respuesta);
    component.cambiarMentor(asignacion, '9');
    service.asignaciones.and.returnValue(of([{ ...asignacion, nombreCompleto: 'Ana Actualizada' }]));

    component.cargar();
    respuesta.next({ ...asignacion, mentor });

    expect(component.asignaciones()[0].nombreCompleto).toBe('Ana Actualizada');
    expect(component.asignaciones()[0].mentor).toEqual(mentor);
  });
});
