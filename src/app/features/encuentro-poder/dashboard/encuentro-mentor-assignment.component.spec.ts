import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';
import { EncuentroMentorAssignmentComponent } from './encuentro-mentor-assignment.component';

describe('EncuentroMentorAssignmentComponent', () => {
  let fixture: ComponentFixture<EncuentroMentorAssignmentComponent>;
  let component: EncuentroMentorAssignmentComponent;
  let service: jasmine.SpyObj<EncuentroMentoriaService>;
  const mentor = { id: 9, username: 'mentor', nombreCompleto: 'Mentor Uno', email: 'mentor@example.com', enabled: true };
  const asignacion = { inscripcionId: 42, personaId: 10, nombreCompleto: 'Ana Pérez', telefono: '+56911111111', mentor: null };

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
    expect(fixture.nativeElement.textContent).toContain('Sin mentor');
    expect(fixture.nativeElement.textContent).toContain('Mentor Uno');
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
});
