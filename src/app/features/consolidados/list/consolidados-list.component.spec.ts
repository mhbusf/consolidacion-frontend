import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ConsolidadoResponse } from '../../../core/models/consolidado.model';
import { ConsolidadoService } from '../../../core/services/consolidado.service';
import { JwtResponse, RoleName } from '../../../core/models/auth.model';
import { ConsolidadosListComponent } from './consolidados-list.component';
import { ReporteConsolidadoService } from '../../../core/services/reporte-consolidado.service';

describe('ConsolidadosListComponent WhatsApp', () => {
  let fixture: ComponentFixture<ConsolidadosListComponent>;
  let service: jasmine.SpyObj<ConsolidadoService>;
  let reporteService: jasmine.SpyObj<ReporteConsolidadoService>;
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const consolidado: ConsolidadoResponse = {
    id: 1,
    nombre: 'Ana Pérez',
    telefono: '+56 9 1111 1111',
    edad: 30,
    quienInvito: 'María',
    motivoOracion: 'Motivo de prueba',
    comuna: null,
    reunion: 'Reunión Centro',
    usuarioReporta: 'reporta',
    usuarioAsignado: 'consolidador',
    usuarioAsigno: 'admin',
    fechaIngreso: '2026-10-29T10:00:00',
    estado: 'ASIGNADO',
    gdc: null,
    fechaCierre: null,
    comentarioCierre: null,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<ConsolidadoService>('ConsolidadoService', [
      'obtenerTodos', 'obtenerCerrados',
    ]);
    service.obtenerTodos.and.returnValue(of([consolidado]));
    service.obtenerCerrados.and.returnValue(of([]));
    reporteService = jasmine.createSpyObj<ReporteConsolidadoService>('ReporteConsolidadoService', ['exportarActivos']);
    reporteService.exportarActivos.and.returnValue(of(new HttpResponse<Blob>({ body: null })));
    queryParams = new BehaviorSubject(convertToParamMap({}));

    const currentUser = new BehaviorSubject<JwtResponse | null>({
      token: 'token',
      username: 'consolidador',
      email: 'consolidador@example.com',
      mustChangePassword: false,
      roles: [{ id: 1, name: RoleName.USER }],
    });
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['getAllUsers'], {
      currentUser$: currentUser.asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [ConsolidadosListComponent],
      providers: [
        { provide: ConsolidadoService, useValue: service },
        { provide: ReporteConsolidadoService, useValue: reporteService },
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsolidadosListComponent);
    fixture.detectChanges();
  });

  it('abre WhatsApp con el teléfono normalizado desde una tarjeta activa', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.btn-whatsapp');

    expect(link.getAttribute('href')).toContain('https://wa.me/56911111111?text=');
    expect(decodeURIComponent(link.getAttribute('href') || '')).toContain('Hola Ana Pérez');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.getAttribute('aria-label')).toBe('Abrir WhatsApp con Ana Pérez');
  });

  it('oculta WhatsApp cuando el teléfono no es válido', () => {
    fixture.componentInstance.consolidados = [{ ...consolidado, telefono: 'sin teléfono' }];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.btn-whatsapp')).toBeNull();
  });

  it('oculta WhatsApp en la vista histórica', () => {
    fixture.componentInstance.vistaHistorico = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.btn-whatsapp')).toBeNull();
  });

  it('permite al administrador exportar todos los consolidados activos', () => {
    fixture.componentInstance.isAdmin = true;
    fixture.detectChanges();

    const button = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('.header-actions button'))
      .find(item => item.textContent?.includes('Exportar Excel'));
    button?.click();

    expect(button).toBeDefined();
    expect(reporteService.exportarActivos).toHaveBeenCalledTimes(1);
  });

  it('no muestra columnas ni controles del hito de tres semanas', () => {
    expect(fixture.nativeElement.textContent).not.toContain('3 semanas');
    expect(fixture.nativeElement.querySelector('.btn-hito')).toBeNull();
  });
});
