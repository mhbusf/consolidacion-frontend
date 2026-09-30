import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Comuna } from '../../../core/models/consolidado.model';
import { ComunaService } from '../../../core/services/comuna.service';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';

@Component({
  selector: 'app-encuentro-public', standalone: true, imports: [CommonModule, ReactiveFormsModule],
  template: `<main class="public-page"><section class="card">
    <span class="eyebrow">Encuentro de Poder</span><h1>Inscripción</h1>
    <p class="muted">Completa tus datos para participar en este ciclo.</p>
    <form [formGroup]="form" (ngSubmit)="enviar()">
      <label>Nombre y apellido *<input formControlName="nombreCompleto"></label>
      <label>Teléfono *<input type="tel" formControlName="telefono" placeholder="+56912345678"></label>
      <label>Comuna<select formControlName="comuna" [disabled]="cargandoComunas"><option value="">{{ cargandoComunas ? 'Cargando comunas...' : 'Selecciona una comuna' }}</option>@for (grupo of comunasPorProvincia; track grupo.provincia) {<optgroup [label]="grupo.provincia">@for (comuna of grupo.comunas; track comuna.id) {<option [value]="comuna.nombre">{{ comuna.nombre }}</option>}</optgroup>}</select></label>
      <label>Invitado por / servidor de GDC<input formControlName="invitadoPor"></label>
      <label>Tiempo en Catedral<input formControlName="tiempoCatedral"></label>
      <button [disabled]="form.invalid || enviando">{{ enviando ? 'Enviando...' : 'Inscribirme' }}</button>
    </form>
    @if (mensaje) { <div class="success">{{ mensaje }}</div> }
    @if (error) { <div class="error">{{ error }}</div> }
  </section></main>`,
  styles: [`:host{display:block;min-height:100vh;background:#101827;color:#f8fafc}.public-page{padding:32px 16px}.card{max-width:520px;margin:auto;background:#182337;border:1px solid #334155;border-radius:18px;padding:32px;box-shadow:0 18px 50px #0004}h1{font-size:34px;margin:8px 0}.eyebrow{color:#8fb7ff;font-weight:700}.muted{color:#aab7ca}label{display:grid;gap:7px;margin:18px 0;color:#dbe5f2;font-weight:600}input,select{box-sizing:border-box;width:100%;padding:12px;border:1px solid #475569;border-radius:9px;background:#0f172a;color:#fff;font:inherit}select:disabled{opacity:.6}button{width:100%;padding:13px;border:0;border-radius:9px;background:#4f8cff;color:#fff;font-weight:700;cursor:pointer}button:disabled{opacity:.55}.success,.error{margin-top:18px;padding:14px;border-radius:9px}.success{background:#164e3b}.error{background:#642c35}`],
})
export class EncuentroPublicComponent implements OnInit {
  private fb = inject(FormBuilder); private route = inject(ActivatedRoute); private service = inject(EncuentroPoderService); private comunaService = inject(ComunaService);
  form = this.fb.nonNullable.group({ nombreCompleto: ['', [Validators.required, Validators.minLength(3)]], telefono: ['', [Validators.required, Validators.minLength(8)]], comuna: [''], invitadoPor: [''], tiempoCatedral: [''] });
  comunasPorProvincia: { provincia: string; comunas: Comuna[] }[] = [];
  cargandoComunas = true; enviando = false; mensaje = ''; error = '';
  ngOnInit(): void { this.comunaService.listarTodas().subscribe({ next: comunas => { const grupos = comunas.reduce((map, comuna) => { const lista = map.get(comuna.provincia) ?? []; lista.push(comuna); map.set(comuna.provincia, lista); return map; }, new Map<string, Comuna[]>()); this.comunasPorProvincia = [...grupos].map(([provincia, lista]) => ({ provincia, comunas: lista })).sort((a, b) => a.provincia.localeCompare(b.provincia, 'es')); this.cargandoComunas = false; }, error: () => { this.error = 'No fue posible cargar las comunas.'; this.cargandoComunas = false; } }); }
  enviar(): void { if (this.form.invalid) return; this.enviando = true; this.error = ''; this.service.inscribir(this.route.snapshot.paramMap.get('token') ?? '', this.form.getRawValue()).subscribe({ next: r => { this.mensaje = `Inscripción registrada para ${r.persona.nombreCompleto}.`; this.form.reset(); this.enviando = false; }, error: e => { this.error = e.error?.message ?? 'No fue posible completar la inscripción.'; this.enviando = false; } }); }
}
