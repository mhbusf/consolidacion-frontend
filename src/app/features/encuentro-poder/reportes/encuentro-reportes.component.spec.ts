import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { EncuentroCumplimientoFeedback } from '../../../core/models/encuentro-mentoria.model';
import { EncuentroCiclo, EncuentroDashboard } from '../../../core/models/encuentro-poder.model';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';
import { EncuentroReportesComponent } from './encuentro-reportes.component';

const clases = [
  { id: 11, nombre: 'Clase 1', orden: 1, fecha: '2026-10-01', obligatoria: true, publicToken: 'c1', estado: 'FINALIZADA' as const },
  { id: 12, nombre: 'Clase 2', orden: 2, fecha: '2026-10-08', obligatoria: true, publicToken: 'c2', estado: 'FINALIZADA' as const },
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
  clasesCompletadas: 2,
  clasesFaltantes: ['Clase 3'],
  estado: 'PENDIENTE' as const,
  asistencias: [
    { id: 5, personaId: 3, claseId: 11, clase: 'Clase 1', metodo: 'QR', fechaHora: '2026-10-01T20:00:00' },
    { id: 6, personaId: 3, claseId: 12, clase: 'Clase 2', metodo: 'QR', fechaHora: '2026-10-08T20:00:00' },
  ],
};

function dashboard(): EncuentroDashboard {
  return {
    ciclo,
    inscritos: 4,
    activos: 3,
    noContinuaron: 1,
    conAsistencia: 2,
    completos: 1,
    pendientes: 2,
    clases: clases.map(clase => ({
      claseId: clase.id,
      nombre: clase.nombre,
      fecha: clase.fecha,
      presentes: clase.id === 11 || clase.id === 12 ? 2 : 0,
      inscritos: 3,
      ausentes: clase.id === 11 || clase.id === 12 ? 1 : 0,
      estado: clase.estado,
    })),
    participantes: [graduate, failed, inProgress],
    graduados: [graduate],
    historialNoContinuaron: [{
      id: 50,
      inscripcionId: 40,
      persona: { id: 4, nombreCompleto: 'Persona No Continúa', telefono: '56944444444', comuna: 'Renca' },
      motivo: 'INASISTENCIA_CLASE_1',
      fechaExclusion: '2026-10-02T10:30:00',
      excluidoPor: 'Super Admin',
      mentorAnterior: 'Mentor Anterior',
      fechaReintegracion: null,
      reintegradoPor: null,
      estadoActual: 'NO_CONTINUA',
    }],
  };
}

function cumplimientoFeedback(): EncuentroCumplimientoFeedback {
  return {
    ciclo: { id: 7, nombre: 'Octubre 2026', fechaInicio: '2026-10-01', fechaCierre: null, estado: 'ABIERTO' },
    fechaCorte: '2026-10-09',
    requeridos: 3,
    cumplidos: 2,
    porcentaje: 67,
    periodos: [{
      semana: 1,
      claseDesde: 'Clase 0 - Informativa',
      claseHasta: 'Clase 1',
      desde: '2026-10-01',
      hasta: '2026-10-07',
      cerrado: false,
      requeridos: 3,
      cumplidos: 2,
      porcentaje: 67,
      mentores: [{
        mentor: { id: 9, username: 'mentor', nombre: 'Mentor', apellido: 'Uno', email: 'mentor@example.test' },
        requeridos: 3,
        cumplidos: 2,
        porcentaje: 67,
        participantes: [{
          inscripcionId: 42,
          persona: { id: 2, nombreCompleto: 'Persona Pendiente', telefono: '56922222222', comuna: 'Maipú' },
          fechaAsignacion: '2026-10-01T10:00:00',
          cumplido: false,
          feedbackId: null,
          fechaFeedback: null,
        }],
      }],
    }],
  };
}

describe('EncuentroReportesComponent', () => {
  let fixture: ComponentFixture<EncuentroReportesComponent>;
  let component: EncuentroReportesComponent;
  let service: jasmine.SpyObj<EncuentroPoderService>;
  let mentoriaService: jasmine.SpyObj<EncuentroMentoriaService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroPoderService>('EncuentroPoderService', [
      'ciclos', 'dashboard', 'exportarReporte',
      'reintegrar',
    ]);
    service.ciclos.and.returnValue(of([{ ...ciclo, clases: [] }]));
    service.dashboard.and.returnValue(of(dashboard()));
    service.exportarReporte.and.returnValue(of(new Blob()));
    service.reintegrar.and.returnValue(of(dashboard().historialNoContinuaron[0]));
    mentoriaService = jasmine.createSpyObj<EncuentroMentoriaService>('EncuentroMentoriaService', [
      'cumplimientoFeedback',
    ]);
    mentoriaService.cumplimientoFeedback.and.returnValue(of(cumplimientoFeedback()));

    await TestBed.configureTestingModule({
      imports: [EncuentroReportesComponent],
      providers: [
        { provide: EncuentroPoderService, useValue: service },
        { provide: EncuentroMentoriaService, useValue: mentoriaService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EncuentroReportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra totales, asistencia y resultados separados por situación', () => {
    const text = fixture.nativeElement.textContent;

    expect(service.dashboard).toHaveBeenCalledOnceWith(7);
    expect(mentoriaService.cumplimientoFeedback).toHaveBeenCalledOnceWith(7);
    expect(text).toContain('Números totales');
    expect(text).toContain('Asistencia por clase');
    expect(text).toContain('Persona Ausente');
    expect(text).toContain('Clase 1');
    expect(text).toContain('Persona Graduada');
    expect(text).toContain('Persona No Continúa');
    expect(text).toContain('Mentor Anterior');
    expect(component.noCumplen().map(persona => persona.persona.id)).toEqual([2]);
    expect(component.enProceso().map(persona => persona.persona.id)).toEqual([3]);
    expect(component.seguimientoPorClase().map(item => ({
      clase: item.clase.nombre,
      personas: item.participantes.map(participante => participante.persona.id),
    }))).toEqual([
      { clase: 'Clase 1', personas: [2] },
      { clase: 'Clase 2', personas: [2] },
    ]);
    expect(component.clasesAusentesFinalizadas(failed)).toEqual(['Clase 1', 'Clase 2']);
  });

  it('incluye etiquetas y foco para las tablas operativas en móvil', () => {
    const mobileTables = fixture.nativeElement.querySelectorAll('.mobile-card-table');
    const cells = fixture.nativeElement.querySelectorAll('.mobile-card-table td[data-label]') as NodeListOf<Element>;
    const labels = Array.from(cells).map(cell => cell.getAttribute('data-label'));

    expect(mobileTables.length).toBe(2);
    expect(Array.from(mobileTables).every((table: unknown) => (table as HTMLElement).tabIndex === 0)).toBeTrue();
    expect(labels).toContain('Participante');
    expect(labels).toContain('Acción');
  });

  it('muestra el cumplimiento semanal por mentor y sus participantes pendientes', () => {
    const text = fixture.nativeElement.textContent;
    const progress = fixture.nativeElement.querySelector('[aria-label="Cumplimiento de feedback de la semana 1"]');

    expect(text).toContain('Cumplimiento semanal de feedback');
    expect(text).toContain('Clase 0 - Informativa');
    expect(text).toContain('En curso');
    expect(text).toContain('Mentor Uno');
    expect(text).toContain('Persona Pendiente');
    expect(progress.getAttribute('aria-valuenow')).toBe('67');
  });

  it('presenta un informe por mentor que indica si realizó los feedbacks de cada semana', () => {
    const text = fixture.nativeElement.textContent;
    const informe = component.informeFeedbackPorMentor();

    expect(text).toContain('Informe por mentor');
    expect(text).toContain('Parcial');
    expect(informe.length).toBe(1);
    expect(informe[0].cumplidos).toBe(2);
    expect(informe[0].requeridos).toBe(3);
    expect(component.estadoCumplimiento({ cumplidos: 3, requeridos: 3 })).toBe('Sí');
    expect(component.estadoCumplimiento({ cumplidos: 0, requeridos: 3 })).toBe('No');
    expect(component.estadoCumplimiento(null)).toBe('No aplica');
  });

  it('mantiene los demás resultados si falla solo el cumplimiento de feedback', () => {
    fixture.destroy();
    mentoriaService.cumplimientoFeedback.and.returnValue(throwError(() => new Error('sin conexión')));
    const failedFixture = TestBed.createComponent(EncuentroReportesComponent);
    failedFixture.detectChanges();

    expect(failedFixture.nativeElement.textContent).toContain('Números totales');
    expect(failedFixture.nativeElement.textContent).toContain('No fue posible cargar el cumplimiento semanal');
    expect(failedFixture.nativeElement.querySelector('.compliance-alert button')).not.toBeNull();
    failedFixture.destroy();
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

  it('reincorpora por inscripción y recarga el dashboard', () => {
    const registro = component.dashboard()!.historialNoContinuaron[0];

    component.reintegrar(registro);

    expect(service.reintegrar).toHaveBeenCalledOnceWith(40);
    expect(service.dashboard).toHaveBeenCalledTimes(2);
    expect(component.mensaje()).toContain('Persona No Continúa se reincorporó');
  });
});
