import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EncuentroAsistenciaPublica, EncuentroEstadoClase } from '../../../core/models/encuentro-poder.model';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';
import { AsistenciaPublicComponent } from './asistencia-public.component';

describe('AsistenciaPublicComponent', () => {
  let fixture: ComponentFixture<AsistenciaPublicComponent>;
  let component: AsistenciaPublicComponent;
  let service: jasmine.SpyObj<EncuentroPoderService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroPoderService>('EncuentroPoderService', ['infoAsistencia', 'autoAsistencia']);

    await TestBed.configureTestingModule({
      imports: [AsistenciaPublicComponent],
      providers: [
        { provide: EncuentroPoderService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 'clase-token' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenciaPublicComponent);
    component = fixture.componentInstance;
  });

  it('permite registrar asistencia solamente cuando la clase está en curso', () => {
    service.infoAsistencia.and.returnValue(of(info('EN_CURSO')));
    service.autoAsistencia.and.returnValue(of({
      id: 31,
      personaId: 21,
      claseId: 11,
      clase: 'Clase 1',
      metodo: 'QR',
      fechaHora: '2026-10-08T20:00:00',
    }));
    fixture.detectChanges();
    component.form.setValue({ nombreCompleto: 'Persona Prueba', telefono: '56912345678' });

    component.enviar();
    fixture.detectChanges();

    expect(service.autoAsistencia).toHaveBeenCalledOnceWith('clase-token', { nombreCompleto: 'Persona Prueba', telefono: '56912345678' });
    expect(fixture.nativeElement.textContent).toContain('Asistencia registrada correctamente');
  });

  it('informa que una clase programada todavía no recibe asistencia', () => {
    service.infoAsistencia.and.returnValue(of(info('PROGRAMADA')));

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('estará disponible el día de la clase');
  });

  it('informa que la autoasistencia de una clase finalizada está cerrada', () => {
    service.infoAsistencia.and.returnValue(of(info('FINALIZADA')));

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('autoasistencia ya finalizó');
  });

  it('muestra el rechazo del backend si una página abierta queda fuera de fecha', () => {
    service.infoAsistencia.and.returnValue(of(info('EN_CURSO')));
    service.autoAsistencia.and.returnValue(throwError(() => ({ error: { message: 'La autoasistencia de esta clase ya finalizó' } })));
    fixture.detectChanges();
    component.form.setValue({ nombreCompleto: 'Persona Prueba', telefono: '56912345678' });

    component.enviar();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La autoasistencia de esta clase ya finalizó');
  });

  function info(estado: EncuentroEstadoClase): EncuentroAsistenciaPublica {
    return {
      cicloNombre: 'Octubre 2026',
      claseNombre: 'Clase 1',
      fecha: '2026-10-08',
      inscripcionToken: 'ciclo-token',
      estado,
    };
  }
});
