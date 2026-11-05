import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { EncuentroInscripcion } from '../../../core/models/encuentro-poder.model';
import { ComunaService } from '../../../core/services/comuna.service';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';
import { EncuentroParticipantesAdminComponent } from './encuentro-participantes-admin.component';

describe('EncuentroParticipantesAdminComponent', () => {
  let fixture: ComponentFixture<EncuentroParticipantesAdminComponent>;
  let component: EncuentroParticipantesAdminComponent;
  let service: jasmine.SpyObj<EncuentroPoderService>;
  const inscripcion: EncuentroInscripcion = {
    id: 41,
    persona: { id: 21, nombreCompleto: 'Ana Pérez', telefono: '56911111111', comuna: 'Santiago' },
    cicloId: 7,
    fechaInscripcion: '2026-10-01T10:00:00',
    estadoParticipacion: 'ACTIVO',
    invitadoPor: 'Pedro Servidor',
    tiempoCatedral: '1 año',
    personaRevision: 'revision-1',
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroPoderService>('EncuentroPoderService', ['inscritos', 'actualizarInscripcion']);
    service.inscritos.and.returnValue(of([inscripcion]));
    const comunaService = jasmine.createSpyObj<ComunaService>('ComunaService', ['listarTodas']);
    comunaService.listarTodas.and.returnValue(of([{ id: 1, nombre: 'Santiago', provincia: 'Santiago', region: 'Metropolitana' }]));

    await TestBed.configureTestingModule({
      imports: [EncuentroParticipantesAdminComponent],
      providers: [
        { provide: EncuentroPoderService, useValue: service },
        { provide: ComunaService, useValue: comunaService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EncuentroParticipantesAdminComponent);
    fixture.componentRef.setInput('cicloId', 7);
    fixture.componentRef.setInput('cicloNombre', 'Octubre 2026');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga y muestra los datos del participante para el ciclo', () => {
    expect(service.inscritos).toHaveBeenCalledOnceWith(7);
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('Pedro Servidor');
  });

  it('abre la edición separando datos globales y datos del ciclo', () => {
    component.abrir(inscripcion);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Datos globales de la persona');
    expect(fixture.nativeElement.textContent).toContain('Datos de este ciclo');
    expect(component.form.getRawValue()).toEqual({
      nombreCompleto: 'Ana Pérez',
      telefono: '56911111111',
      comuna: 'Santiago',
      invitadoPor: 'Pedro Servidor',
      tiempoCatedral: '1 año',
    });
  });

  it('renderiza como máximo 25 participantes y reinicia la página al buscar', () => {
    component.inscripciones.set(Array.from({ length: 26 }, (_, index) => ({
      ...inscripcion,
      id: index + 1,
      persona: {
        ...inscripcion.persona,
        id: index + 1,
        nombreCompleto: `Participante ${index + 1}`,
      },
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

  it('guarda por id de inscripción y actualiza la fila', () => {
    const actualizada: EncuentroInscripcion = {
      ...inscripcion,
      persona: { ...inscripcion.persona, nombreCompleto: 'Ana Corregida' },
      invitadoPor: 'Nueva servidora',
    };
    service.actualizarInscripcion.and.returnValue(of(actualizada));
    spyOn(component.actualizada, 'emit');
    component.abrir(inscripcion);
    component.form.patchValue({ nombreCompleto: 'Ana Corregida', invitadoPor: 'Nueva servidora' });

    component.guardar();

    expect(service.actualizarInscripcion).toHaveBeenCalledOnceWith(41, {
      nombreCompleto: 'Ana Corregida',
      telefono: '56911111111',
      comuna: 'Santiago',
      invitadoPor: 'Nueva servidora',
      tiempoCatedral: '1 año',
      personaRevision: 'revision-1',
    });
    expect(component.inscripciones()[0]).toEqual(actualizada);
    expect(component.actualizada.emit).toHaveBeenCalled();
    expect(component.editando()).toBeNull();
  });

  it('cancela una edición pendiente al cambiar de ciclo', () => {
    const respuesta = new Subject<EncuentroInscripcion>();
    service.actualizarInscripcion.and.returnValue(respuesta);
    component.abrir(inscripcion);
    component.guardar();
    expect(component.guardando()).toBeTrue();

    fixture.componentRef.setInput('cicloId', 8);
    fixture.detectChanges();

    expect(component.editando()).toBeNull();
    expect(component.guardando()).toBeFalse();
    expect(service.inscritos).toHaveBeenCalledWith(8);
  });

  it('recarga la versión actual cuando la edición queda obsoleta', () => {
    const actual: EncuentroInscripcion = {
      ...inscripcion,
      invitadoPor: 'Servidor actualizado',
      personaRevision: 'revision-2',
    };
    service.actualizarInscripcion.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { code: 'STALE_REVISION', message: 'Los datos cambiaron' },
    })));
    service.inscritos.and.returnValue(of([actual]));
    component.abrir(inscripcion);

    component.guardar();

    expect(service.inscritos).toHaveBeenCalledTimes(2);
    expect(component.editando()).toEqual(actual);
    expect(component.form.controls.invitadoPor.value).toBe('Servidor actualizado');
    expect(component.errorEdicion()).toContain('versión recargada');
  });

  it('mantiene el formulario cuando el conflicto corresponde al teléfono', () => {
    service.actualizarInscripcion.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { message: 'El teléfono ya pertenece a otra persona' },
    })));
    component.abrir(inscripcion);
    component.form.patchValue({ nombreCompleto: 'Ana editada' });

    component.guardar();

    expect(service.inscritos).toHaveBeenCalledTimes(1);
    expect(component.editando()).toEqual(inscripcion);
    expect(component.form.controls.nombreCompleto.value).toBe('Ana editada');
    expect(component.errorEdicion()).toBe('El teléfono ya pertenece a otra persona');
  });

  it('no reabre una edición cerrada mientras se recargaba un conflicto', () => {
    const recarga = new Subject<EncuentroInscripcion[]>();
    service.actualizarInscripcion.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { code: 'STALE_REVISION' },
    })));
    service.inscritos.and.returnValue(recarga);
    component.abrir(inscripcion);
    component.guardar();

    component.cerrar();
    recarga.next([{ ...inscripcion, personaRevision: 'revision-2' }]);

    expect(component.editando()).toBeNull();
  });
});
