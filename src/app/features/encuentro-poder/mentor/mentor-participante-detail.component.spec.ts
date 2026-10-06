import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { EncuentroMentorFeedback } from '../../../core/models/encuentro-mentoria.model';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';
import { MentorParticipanteDetailComponent } from './mentor-participante-detail.component';

describe('MentorParticipanteDetailComponent', () => {
  let fixture: ComponentFixture<MentorParticipanteDetailComponent>;
  let component: MentorParticipanteDetailComponent;
  let service: jasmine.SpyObj<EncuentroMentoriaService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroMentoriaService>('EncuentroMentoriaService', [
      'participante', 'feedback', 'crearFeedback',
    ]);
    service.participante.and.returnValue(of({
      inscripcionId: 42,
      personaId: 10,
      cicloId: 2,
      cicloNombre: 'Octubre 2026',
      nombreCompleto: 'Ana Pérez',
      telefono: '+56911111111',
      comuna: 'Santiago',
      clasesCompletadas: 1,
      totalClases: 3,
      porcentajeProgreso: 33,
      fechaInscripcion: '2026-09-20',
      asistencias: [{ claseId: 1, claseNombre: 'Clase 1', fecha: '2026-10-01', asistio: true }],
    }));
    service.feedback.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MentorParticipanteDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ inscripcionId: '42' }) } } },
        { provide: EncuentroMentoriaService, useValue: service },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MentorParticipanteDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra datos, progreso, asistencias e historial vacío', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ana Pérez');
    expect(text).toContain('33%');
    expect(text).toContain('Clase 1');
    expect(text).toContain('Todavía no hay feedback registrado');
    const whatsapp: HTMLAnchorElement = fixture.nativeElement.querySelector('.whatsapp-link');
    expect(whatsapp.getAttribute('href')).toBe('https://wa.me/56911111111');
    expect(whatsapp.getAttribute('target')).toBe('_blank');
    expect(whatsapp.getAttribute('rel')).toBe('noopener noreferrer');
    expect(whatsapp.getAttribute('aria-label')).toBe('Abrir WhatsApp con Ana Pérez');
  });

  it('evita doble envío y limpia el texto solo al confirmar', () => {
    const response = new Subject<EncuentroMentorFeedback>();
    service.crearFeedback.and.returnValue(response);
    component.comentario.setValue('Nota de seguimiento');

    component.guardarFeedback();
    component.guardarFeedback();

    expect(service.crearFeedback).toHaveBeenCalledOnceWith(42, { comentario: 'Nota de seguimiento' });
    expect(component.comentario.value).toBe('Nota de seguimiento');
    response.next({ id: 5, comentario: 'Nota de seguimiento', fechaCreacion: '2026-10-02', mentorNombre: 'Mentor' });
    response.complete();
    expect(component.comentario.value).toBe('');
    expect(component.feedback().length).toBe(1);
  });

  it('conserva el texto cuando falla el feedback', () => {
    service.crearFeedback.and.returnValue(throwError(() => new Error('fallo')));
    component.comentario.setValue('Texto que no debe perderse');

    component.guardarFeedback();

    expect(component.comentario.value).toBe('Texto que no debe perderse');
    expect(component.errorFeedback()).toContain('Tu texto se conservó');
  });

  it('limita el feedback a 5000 caracteres', () => {
    component.comentario.setValue('x'.repeat(5001));
    component.guardarFeedback();

    expect(component.comentario.hasError('maxlength')).toBeTrue();
    expect(service.crearFeedback).not.toHaveBeenCalled();
  });

  it('rechaza feedback compuesto solo por espacios', () => {
    component.comentario.setValue('   ');

    component.guardarFeedback();
    fixture.detectChanges();

    expect(component.comentario.hasError('required')).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('El comentario es obligatorio');
    expect(service.crearFeedback).not.toHaveBeenCalled();
  });
});
