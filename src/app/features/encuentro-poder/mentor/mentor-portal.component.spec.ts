import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';
import { MentorPortalComponent } from './mentor-portal.component';

describe('MentorPortalComponent', () => {
  let fixture: ComponentFixture<MentorPortalComponent>;
  let service: jasmine.SpyObj<EncuentroMentoriaService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroMentoriaService>('EncuentroMentoriaService', ['ciclosAsistencia', 'misParticipantes', 'resumenPortal']);
    service.ciclosAsistencia.and.returnValue(of([{
      id: 2,
      nombre: 'Octubre 2026',
      estado: 'ABIERTO',
      clases: [],
    }]));
    service.misParticipantes.and.returnValue(of([{
      inscripcionId: 42,
      personaId: 10,
      cicloId: 2,
      cicloNombre: 'Octubre 2026',
      nombreCompleto: 'Ana Pérez',
      telefono: '+56911111111',
      comuna: 'Santiago',
      clasesCompletadas: 2,
      totalClases: 3,
      porcentajeProgreso: 67,
      asistencias: [
        { claseId: 10, claseNombre: 'Clase 0 - Informativa', orden: 0, fecha: '2026-09-24', obligatoria: false, asistio: true },
        { claseId: 11, claseNombre: 'Clase 1', orden: 1, fecha: '2026-10-01', obligatoria: true, asistio: false },
      ],
      cicloEstado: 'ABIERTO',
      etapaMentoria: 'ACTIVA',
      cierreHasta: '2026-10-22',
      ultimoFeedback: { id: 1, comentario: 'Conversación inicial', fechaCreacion: '2026-10-01T10:00:00', mentorNombre: 'Mentor' },
    }]));
    service.resumenPortal.and.returnValue(of({
      ciclo: { id: 2, nombre: 'Octubre 2026', fechaInicio: '2026-10-01', fechaCierre: null, estado: 'ABIERTO' },
      participantesAsignados: 1,
      asistenciasRegistradas: 2,
      asistenciasEsperadas: 3,
      porcentajeAsistencia: 67,
      participantesCompletos: 0,
      participantesPendientes: 1,
    }));

    await TestBed.configureTestingModule({
      imports: [MentorPortalComponent],
      providers: [provideRouter([]), { provide: EncuentroMentoriaService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(MentorPortalComponent);
    fixture.detectChanges();
  });

  it('muestra progreso, último feedback y acciones del participante', () => {
    expect(service.misParticipantes).toHaveBeenCalledWith(2);
    expect(service.resumenPortal).toHaveBeenCalledWith(2);
    expect(fixture.nativeElement.querySelector('#mentor-cycle')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('Progreso obligatorio');
    expect(fixture.nativeElement.textContent).toContain('2 de 3 clases');
    expect(fixture.nativeElement.textContent).toContain('Asistencia por clase');
    expect(fixture.nativeElement.textContent).toContain('C0');
    expect(fixture.nativeElement.textContent).toContain('Registrada');
    expect(fixture.nativeElement.textContent).toContain('C1');
    expect(fixture.nativeElement.textContent).toContain('Sin registro');
    expect(fixture.nativeElement.textContent).toContain('Conversación inicial');
    expect(fixture.nativeElement.querySelector('a[href="/encuentro-poder/mentor/42"]')).not.toBeNull();
    const whatsapp: HTMLAnchorElement = fixture.nativeElement.querySelector('.whatsapp-link');
    expect(whatsapp.getAttribute('href')).toBe('https://wa.me/56911111111');
    expect(whatsapp.getAttribute('target')).toBe('_blank');
    expect(whatsapp.getAttribute('rel')).toBe('noopener noreferrer');
    expect(whatsapp.getAttribute('aria-label')).toBe('Abrir WhatsApp con Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('Asistencia');
    expect(fixture.nativeElement.textContent).toContain('67%');
  });

  it('no muestra WhatsApp cuando el teléfono no es válido', () => {
    fixture.componentInstance.participantes.update(participantes =>
      participantes.map(participante => ({ ...participante, telefono: 'sin teléfono' })),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.whatsapp-link')).toBeNull();
  });

  it('filtra por nombre, teléfono o ciclo', () => {
    fixture.componentInstance.busqueda.set('sin coincidencia');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sin coincidencias');
    expect(fixture.nativeElement.textContent).not.toContain('Conversación inicial');
  });

  it('separa participantes activos, en cierre e históricos manteniendo acceso al feedback', () => {
    const activa = fixture.componentInstance.participantes()[0];
    fixture.componentInstance.participantes.set([
      activa,
      { ...activa, inscripcionId: 43, personaId: 11, nombreCompleto: 'Beatriz Soto', etapaMentoria: 'CIERRE' },
      { ...activa, inscripcionId: 44, personaId: 12, nombreCompleto: 'Carlos Díaz', etapaMentoria: 'HISTORICA' },
    ]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Participantes activos');
    expect(text).toContain('Periodo de cierre');
    expect(text).toContain('Historial');
    expect(fixture.nativeElement.querySelector('a[href="/encuentro-poder/mentor/44"]')).not.toBeNull();
    expect(text).toContain('Ver detalle y feedback');
  });

  it('mantiene los participantes visibles cuando falla solo el resumen', () => {
    service.resumenPortal.and.returnValue(throwError(() => new Error('fallo')));

    fixture.componentInstance.cargar();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('La lista de participantes sigue disponible');
    expect(fixture.nativeElement.textContent).not.toContain('No pudimos cargar la información');
  });

  it('descarta participantes que no pertenecen al ciclo indicado por el resumen', () => {
    const actual = fixture.componentInstance.participantes()[0];
    service.misParticipantes.and.returnValue(of([
      actual,
      { ...actual, inscripcionId: 50, cicloId: 3, cicloNombre: 'Noviembre 2026', nombreCompleto: 'Persona futura' },
    ]));

    fixture.componentInstance.cargar();
    fixture.detectChanges();

    expect(fixture.componentInstance.participantes().map(item => item.inscripcionId)).toEqual([42]);
    expect(fixture.nativeElement.textContent).not.toContain('Persona futura');
    expect(fixture.nativeElement.textContent).not.toContain('Noviembre 2026');
  });

  it('recarga participantes y resumen al seleccionar otro ciclo', () => {
    const actual = fixture.componentInstance.participantes()[0];
    service.misParticipantes.calls.reset();
    service.resumenPortal.calls.reset();
    service.misParticipantes.and.returnValue(of([{
      ...actual,
      inscripcionId: 50,
      cicloId: 3,
      cicloNombre: 'Noviembre 2026',
      nombreCompleto: 'Persona noviembre',
    }]));
    service.resumenPortal.and.returnValue(of({
      ciclo: { id: 3, nombre: 'Noviembre 2026', fechaInicio: '2026-11-01', fechaCierre: null, estado: 'ABIERTO' },
      participantesAsignados: 1,
      asistenciasRegistradas: 0,
      asistenciasEsperadas: 0,
      porcentajeAsistencia: 0,
      participantesCompletos: 0,
      participantesPendientes: 1,
    }));

    fixture.componentInstance.seleccionarCiclo('3');
    fixture.detectChanges();

    expect(service.misParticipantes).toHaveBeenCalledWith(3);
    expect(service.resumenPortal).toHaveBeenCalledWith(3);
    expect(fixture.nativeElement.textContent).toContain('Noviembre 2026');
    expect(fixture.nativeElement.textContent).toContain('Persona noviembre');
  });

  it('vuelve a consultar los ciclos cuando falla la carga inicial', () => {
    service.ciclosAsistencia.calls.reset();
    fixture.componentInstance.ciclos.set([]);

    fixture.componentInstance.reintentar();

    expect(service.ciclosAsistencia).toHaveBeenCalled();
  });
});
