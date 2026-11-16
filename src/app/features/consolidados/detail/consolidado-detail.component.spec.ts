import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ConsolidadoResponse } from '../../../core/models/consolidado.model';
import { AuthService } from '../../../core/services/auth.service';
import { ComentarioService } from '../../../core/services/comentario.service';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { HttpErrorMapperService } from '../../../core/services/http-error-mapper.service';
import { LoggerService } from '../../../core/services/logger.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConsolidadoDetailComponent } from './consolidado-detail.component';

describe('ConsolidadoDetailComponent', () => {
  let fixture: ComponentFixture<ConsolidadoDetailComponent>;

  const consolidado: ConsolidadoResponse = {
    id: 1,
    nombre: 'Ana',
    telefono: '56911111111',
    edad: 30,
    quienInvito: 'María',
    motivoOracion: 'Motivo',
    comuna: null,
    reunion: 'Centro',
    usuarioReporta: 'reporta',
    usuarioAsignado: 'consolidador',
    usuarioAsigno: 'admin',
    fechaIngreso: '2026-10-01',
    estado: 'EN_PROCESO',
    gdc: null,
    fechaCierre: null,
    comentarioCierre: null,
  };

  beforeEach(async () => {
    const consolidadoService = jasmine.createSpyObj<ConsolidadoService>(
      'ConsolidadoService',
      ['obtenerPorId', 'cerrar'],
    );
    consolidadoService.obtenerPorId.and.returnValue(of(consolidado));
    const comentarioService = jasmine.createSpyObj<ComentarioService>(
      'ComentarioService',
      ['listar', 'agregar', 'cerrarConGDC'],
    );
    comentarioService.listar.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ConsolidadoDetailComponent],
      providers: [
        { provide: ConsolidadoService, useValue: consolidadoService },
        { provide: ComentarioService, useValue: comentarioService },
        { provide: AuthService, useValue: jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin']) },
        { provide: NotificationService, useValue: jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']) },
        { provide: LoggerService, useValue: jasmine.createSpyObj<LoggerService>('LoggerService', ['httpError']) },
        { provide: HttpErrorMapperService, useValue: jasmine.createSpyObj<HttpErrorMapperService>('HttpErrorMapperService', ['message']) },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate'], { url: '/consolidados/1' }) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' }),
              queryParamMap: convertToParamMap({}),
              queryParams: {},
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsolidadoDetailComponent);
    fixture.detectChanges();
  });

  it('no muestra información ni controles del hito de tres semanas', () => {
    expect(fixture.nativeElement.textContent).not.toContain('3 semanas');
    expect(fixture.nativeElement.querySelector('.hito-section')).toBeNull();
    expect(fixture.nativeElement.querySelector('.btn-hito')).toBeNull();
  });
});
