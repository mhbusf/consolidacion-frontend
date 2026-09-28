import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EncuentroPoderService } from '../../../core/services/encuentro-poder.service';

@Component({ selector: 'app-encuentro-ciclo-create', standalone: true, imports: [ReactiveFormsModule], template: `<div class="page"><section class="card"><h1>Nuevo ciclo</h1><p>La celebración queda fuera del módulo. Solo se crean las clases de formación.</p><form [formGroup]="form" (ngSubmit)="guardar()"><label>Nombre del ciclo<input formControlName="nombre" placeholder="Octubre 2026"></label><label>Fecha de inicio<input type="date" formControlName="fechaInicio"></label><label>Clase 0 - Informativa<input type="date" formControlName="clase0"></label><label>Clase 1<input type="date" formControlName="clase1"></label><label>Clase 2<input type="date" formControlName="clase2"></label><label>Clase 3<input type="date" formControlName="clase3"></label><button [disabled]="form.invalid || guardando">{{guardando?'Guardando...':'Crear ciclo'}}</button></form>@if(error){<p class="error">{{error}}</p>}</section></div>`, styles: [`.page{max-width:650px;margin:30px auto;padding:20px}.card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:14px;padding:28px}form{display:grid;gap:16px}label{display:grid;gap:7px;font-weight:600}input{padding:11px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary)}button{padding:12px;border:0;border-radius:8px;background:#3978ee;color:#fff;font-weight:700}.error{color:#f87171}`] })
export class EncuentroCicloCreateComponent {
  private fb = inject(FormBuilder); private service = inject(EncuentroPoderService); private router = inject(Router);
  form = this.fb.nonNullable.group({ nombre: ['', Validators.required], fechaInicio: ['', Validators.required], clase0: [''], clase1: ['', Validators.required], clase2: ['', Validators.required], clase3: ['', Validators.required] });
  guardando = false; error = '';
  guardar(): void { if (this.form.invalid) return; this.guardando = true; this.service.crearCiclo(this.form.getRawValue()).subscribe({ next: () => this.router.navigate(['/encuentro-poder']), error: e => { this.error = e.error?.message ?? 'No fue posible crear el ciclo.'; this.guardando = false; } }); }
}
