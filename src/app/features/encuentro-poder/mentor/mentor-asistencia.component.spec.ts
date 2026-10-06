import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { EncuentroMentorAsistenciaClase, EncuentroMentorCiclo } from '../../../core/models/encuentro-mentoria.model';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';
import { MentorAsistenciaComponent } from './mentor-asistencia.component';

describe('MentorAsistenciaComponent', () => {
  let fixture: ComponentFixture<MentorAsistenciaComponent>;
  let service: jasmine.SpyObj<EncuentroMentoriaService>;

  const ciclos: EncuentroMentorCiclo[] = [{
    id: 7,
    nombre: 'Ciclo octubre',
    estado: 'ACTIVO',
    clases: [
      { id: 2, nombre: 'Clase disponible', orden: 1, fecha: '2020-01-01', estado: 'FINALIZADA', obligatoria: true },
      { id: 3, nombre: 'Clase futura', orden: 2, fecha: '2999-01-01', estado: 'PROGRAMADA', obligatoria: true },
      { id: 4, nombre: 'Clase opcional', orden: 3, fecha: '2020-01-01', estado: 'FINALIZADA', obligatoria: false },
      { id: 5, nombre: 'Otra clase', orden: 4, fecha: '2020-01-02', estado: 'FINALIZADA', obligatoria: true },
    ],
  }];
  const participante = {
    inscripcionId: 42,
    personaId: 10,
    nombreCompleto: 'Ana Pérez',
    telefono: '+56911111111',
    presente: false,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroMentoriaService>('EncuentroMentoriaService', [
      'ciclosAsistencia', 'asistenciaClase', 'marcarPresente',
    ]);
    service.ciclosAsistencia.and.returnValue(of(ciclos));
    service.asistenciaClase.and.returnValue(of({
      cicloId: 7, claseId: 2, claseNombre: 'Clase disponible', estado: 'FINALIZADA', participantes: [participante],
    }));
    service.marcarPresente.and.returnValue(of({
      id: 1, personaId: 10, claseId: 2, clase: 'Clase disponible', metodo: 'MANUAL', fechaHora: '2026-10-01T10:00:00',
    }));

    await TestBed.configureTestingModule({
      imports: [MentorAsistenciaComponent],
      providers: [{ provide: EncuentroMentoriaService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(MentorAsistenciaComponent);
    fixture.detectChanges();
  });

  it('carga el roster y deshabilita las clases programadas o futuras', () => {
    fixture.componentInstance.seleccionarCiclo('7');
    fixture.componentInstance.seleccionarClase('2');
    fixture.detectChanges();

    expect(service.asistenciaClase).toHaveBeenCalledOnceWith(7, 2);
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.querySelector('a.whatsapp-link').getAttribute('href')).toContain('wa.me/56911111111');
    const options = Array.from(fixture.nativeElement.querySelectorAll('select option')) as HTMLOptionElement[];
    expect(options.find(option => option.value === '3')?.disabled).toBeTrue();
    expect(options.find(option => option.value === '4')?.disabled).toBeTrue();
  });

  it('evita envíos duplicados y actualiza la presencia local al guardar', () => {
    const response = new Subject<{
      id: number; personaId: number; claseId: number; clase: string; metodo: string; fechaHora: string;
    }>();
    service.marcarPresente.and.returnValue(response);
    fixture.componentInstance.seleccionarCiclo('7');
    fixture.componentInstance.seleccionarClase('2');

    fixture.componentInstance.marcarPresente(participante);
    fixture.componentInstance.marcarPresente(participante);
    expect(service.marcarPresente).toHaveBeenCalledOnceWith(10, 2);

    response.next({
      id: 1, personaId: 10, claseId: 2, clase: 'Clase disponible', metodo: 'MANUAL', fechaHora: '2026-10-01T10:00:00',
    });
    response.complete();
    expect(fixture.componentInstance.participantes()[0].presente).toBeTrue();
  });

  it('ignora una respuesta atrasada después de cambiar de clase', () => {
    const primera = new Subject<EncuentroMentorAsistenciaClase>();
    const segunda = new Subject<EncuentroMentorAsistenciaClase>();
    service.asistenciaClase.and.returnValues(primera, segunda);
    fixture.componentInstance.seleccionarCiclo('7');
    fixture.componentInstance.seleccionarClase('2');
    fixture.componentInstance.seleccionarClase('5');

    segunda.next({
      cicloId: 7, claseId: 5, claseNombre: 'Otra clase', estado: 'FINALIZADA',
      participantes: [{ ...participante, inscripcionId: 43, personaId: 11, nombreCompleto: 'Beatriz Soto' }],
    });
    primera.next({
      cicloId: 7, claseId: 2, claseNombre: 'Clase disponible', estado: 'FINALIZADA', participantes: [participante],
    });

    expect(fixture.componentInstance.participantes()[0].nombreCompleto).toBe('Beatriz Soto');
  });
});
