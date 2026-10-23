import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ComunaService } from '../../../core/services/comuna.service';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';
import { EncuentroPublicComponent } from './encuentro-public.component';

describe('EncuentroPublicComponent', () => {
  let fixture: ComponentFixture<EncuentroPublicComponent>;
  let service: jasmine.SpyObj<EncuentroPoderService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EncuentroPoderService>('EncuentroPoderService', ['infoInscripcion', 'inscribir']);
    service.infoInscripcion.and.returnValue(of({ cicloNombre: 'Octubre 2026' }));
    const comunaService = jasmine.createSpyObj<ComunaService>('ComunaService', ['listarTodas']);
    comunaService.listarTodas.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [EncuentroPublicComponent],
      providers: [
        { provide: EncuentroPoderService, useValue: service },
        { provide: ComunaService, useValue: comunaService },
        { provide: ActivatedRoute, useValue: { snapshot: {
          paramMap: convertToParamMap({ token: 'ciclo-token' }),
          queryParamMap: convertToParamMap({ ciclo: 'Octubre 2026' }),
        } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EncuentroPublicComponent);
    fixture.detectChanges();
  });

  it('muestra en el título el ciclo asociado al enlace público', () => {
    expect(service.infoInscripcion).toHaveBeenCalledOnceWith('ciclo-token');
    const titulo = fixture.nativeElement.querySelector('h1').textContent.replace(/\s+/g, ' ');
    expect(titulo).toContain('Inscripción · Octubre 2026');
  });

  it('usa el ciclo del enlace y permite inscribirse si el backend todavía no puede informarlo', () => {
    fixture.destroy();
    service.infoInscripcion.and.returnValue(throwError(() => ({ status: 500 })));
    fixture = TestBed.createComponent(EncuentroPublicComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      nombreCompleto: 'Persona Prueba',
      telefono: '56912345678',
      comuna: '',
      invitadoPor: '',
      tiempoCatedral: '',
    });
    fixture.detectChanges();

    const titulo = fixture.nativeElement.querySelector('h1').textContent.replace(/\s+/g, ' ');
    expect(titulo).toContain('Inscripción · Octubre 2026');
    expect(fixture.nativeElement.querySelector('.warning')).toBeNull();
    expect(fixture.nativeElement.querySelector('button').disabled).toBeFalse();
  });
});
