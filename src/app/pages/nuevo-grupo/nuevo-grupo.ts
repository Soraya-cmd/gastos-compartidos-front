import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Categoria, GruposService } from '../../core/grupos.service';

@Component({
  selector: 'app-nuevo-grupo',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './nuevo-grupo.html',
  styleUrl: './nuevo-grupo.css',
})
export class NuevoGrupo {
  private fb = inject(FormBuilder);
  private gruposService = inject(GruposService);
  private router = inject(Router);

  error = signal('');
  cargando = signal(false);
  total = signal(0);


  categorias: { valor: Categoria; texto: string }[] = [
    { valor: 'cena', texto: 'Cena' },
    { valor: 'alojamiento', texto: 'Alojamiento' },
    { valor: 'actividades', texto: 'Actividades' },
    { valor: 'transporte', texto: 'Transporte' },
    { valor: 'otros', texto: 'Otros' },
  ];

 
  form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    descripcion: ['', [Validators.maxLength(2000)]],
    gastos: this.fb.nonNullable.array([this.nuevoGasto()]),
  });

  constructor() {
    this.gastos.valueChanges.subscribe(() => this.total.set(this.calcularTotal()));
  }


  get gastos() {
    return this.form.controls.gastos;
  }

  
  private nuevoGasto() {
    return this.fb.nonNullable.group({
      concepto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      categoria: ['otros' as Categoria, [Validators.required]],
      importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
    });
  }

  private calcularTotal(): number {
    return this.gastos.controls.reduce((suma, g) => suma + (Number(g.controls.importe.value) || 0), 0);
  }

  anadirGasto(): void {
    this.gastos.push(this.nuevoGasto());
  }

  quitarGasto(indice: number): void {
    
    if (this.gastos.length > 1) {
      this.gastos.removeAt(indice);
    }
  }

  
  invalido(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.cargando.set(true);

    const valores = this.form.getRawValue();
    this.gruposService
      .crear({
        titulo: valores.titulo.trim(),
        descripcion: valores.descripcion.trim(),
        gastos: valores.gastos.map((g) => ({
          concepto: g.concepto.trim(),
          categoria: g.categoria,
          importe: Number(g.importe),
        })),
      })
      .subscribe({
        next: (grupo) => this.router.navigate(['/grupos', grupo.id]),
        error: (err) => {
          this.cargando.set(false);
          this.error.set(
            err.status === 422
              ? 'Revisa los datos: algún importe o campo no es válido'
              : 'No se pudo crear el grupo. ¿Está encendido el backend?',
          );
        },
      });
  }
}