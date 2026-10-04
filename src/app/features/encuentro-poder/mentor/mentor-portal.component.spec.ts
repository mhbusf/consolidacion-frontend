import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EncuentroMentoriaService } from '../../../core/services/encuentro-mentoria.service';
import { MentorPortalComponent } from './mentor-portal.component';

describe('MentorPortalComponent', () => {
  let fixture: ComponentFixture<MentorPortalComponent>;
  let service: jasmine.SpyObj<EncuentroMentoriaService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroMentoriaService>('EncuentroMentoriaService', ['misParticipantes']);
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
      ultimoFeedback: { id: 1, comentario: 'Conversación inicial', fechaCreacion: '2026-10-01T10:00:00', mentorNombre: 'Mentor' },
    }]));

    await TestBed.configureTestingModule({
      imports: [MentorPortalComponent],
      providers: [provideRouter([]), { provide: EncuentroMentoriaService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(MentorPortalComponent);
    fixture.detectChanges();
  });

  it('muestra progreso, último feedback y enlace al detalle', () => {
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('2 de 3 clases');
    expect(fixture.nativeElement.textContent).toContain('Conversación inicial');
    expect(fixture.nativeElement.querySelector('a[href="/encuentro-poder/mentor/42"]')).not.toBeNull();
  });

  it('filtra por nombre, teléfono o ciclo', () => {
    fixture.componentInstance.busqueda.set('sin coincidencia');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sin coincidencias');
    expect(fixture.nativeElement.textContent).not.toContain('Conversación inicial');
  });
});
