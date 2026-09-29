import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';
import { EncuentroAsistenciaPublica } from '../../../core/models/encuentro-poder.model';

@Component({
  selector: 'app-asistencia-public',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `<main class="public-page"><section class="card">
    <span class="eyebrow">Encuentro de Poder</span>
    @if (info; as clase) {<h1>{{ clase.claseNombre }}</h1><p class="muted">{{ clase.cicloNombre }} · {{ clase.fecha | date:'dd/MM/yyyy' }}</p>}
    @if (cargando) {<p class="muted">Cargando clase...</p>}
    @if (!registrada && info) {<form [formGroup]="form" (ngSubmit)="enviar()"><label>Nombre completo *<input formControlName="nombreCompleto" autocomplete="name"></label><label>Teléfono *<input type="tel" formControlName="telefono" placeholder="+56912345678" autocomplete="tel"></label><button [disabled]="form.invalid || enviando">{{ enviando ? 'Registrando...' : 'Registrar asistencia' }}</button></form>}
    @if (mensaje) {<div class="success">{{ mensaje }}</div>}
    @if (error) {<div class="error">{{ error }}</div>}
    @if (info) {<p class="registration">¿No estás inscrito? <a [href]="'/inscripcion-encuentro/' + info.inscripcionToken">Completa tu inscripción aquí</a>.</p>}
  </section></main>`,
  styles: [`:host{display:block;min-height:100vh;background:#101827;color:#f8fafc}.public-page{padding:32px 16px}.card{max-width:520px;margin:auto;background:#182337;border:1px solid #334155;border-radius:18px;padding:32px;box-shadow:0 18px 50px #0004}h1{font-size:34px;margin:8px 0}.eyebrow{color:#8fb7ff;font-weight:700}.muted{color:#aab7ca}label{display:grid;gap:7px;margin:18px 0;color:#dbe5f2;font-weight:600}input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #475569;border-radius:9px;background:#0f172a;color:#fff;font:inherit}button{width:100%;padding:13px;border:0;border-radius:9px;background:#4f8cff;color:#fff;font-weight:700;cursor:pointer}button:disabled{opacity:.55}.success,.error{margin-top:18px;padding:14px;border-radius:9px}.success{background:#164e3b}.error{background:#642c35}`],
})
export class AsistenciaPublicComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EncuentroPoderService);
  readonly form = this.fb.nonNullable.group({ nombreCompleto: ['', [Validators.required, Validators.minLength(3)]], telefono: ['', [Validators.required, Validators.minLength(8)]] });
  info?: EncuentroAsistenciaPublica;
  cargando = true;
  enviando = false;
  registrada = false;
  mensaje = '';
  error = '';

  ngOnInit(): void {
    this.service.infoAsistencia(this.token()).subscribe({ next: info => { this.info = info; this.cargando = false; }, error: e => { this.error = e.error?.message ?? 'El enlace de asistencia no es válido.'; this.cargando = false; } });
  }

  enviar(): void {
    if (this.form.invalid) return;
    this.enviando = true;
    this.error = '';
    this.service.autoAsistencia(this.token(), this.form.getRawValue()).subscribe({ next: () => { this.mensaje = 'Asistencia registrada correctamente.'; this.registrada = true; this.enviando = false; }, error: e => { this.error = e.error?.message ?? 'No fue posible registrar la asistencia.'; this.enviando = false; } });
  }

  private token(): string { return this.route.snapshot.paramMap.get('token') ?? ''; }
}
