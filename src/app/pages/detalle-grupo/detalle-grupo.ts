import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { Categoria, GrupoDetalle, GruposService, Miembro } from '../../core/grupos.service';

@Component({
  selector: 'app-detalle-grupo',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DecimalPipe, DatePipe],
  templateUrl: './detalle-grupo.html',
  styleUrl: './detalle-grupo.css',
})
export class DetalleGrupo {
  private fb = inject(FormBuilder);
  private gruposService = inject(GruposService);
  private route = inject(ActivatedRoute);

 
  private id = Number(this.route.snapshot.paramMap.get('id'));

  grupo = signal<GrupoDetalle | null>(null);
  cargando = signal(true);
  errorCarga = signal('');
  mensaje = signal(''); 

  categorias: { valor: Categoria; texto: string }[] = [
    { valor: 'cena', texto: 'Cena' },
    { valor: 'alojamiento', texto: 'Alojamiento' },
    { valor: 'actividades', texto: 'Actividades' },
    { valor: 'transporte', texto: 'Transporte' },
    { valor: 'otros', texto: 'Otros' },
  ];

  
  formInvitar = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    porcentaje: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  formGasto = this.fb.nonNullable.group({
    categoria: ['otros' as Categoria, [Validators.required]],
    concepto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  formPago = this.fb.nonNullable.group({
    usuario_id: [null as number | null, [Validators.required]],
    importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
    nota: ['', [Validators.maxLength(255)]],
  });

  constructor() {
    this.gruposService.detalle(this.id).subscribe({
      next: (g) => {
        this.grupo.set(g);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorCarga.set(
          err.status === 404
            ? 'Este grupo no existe o no formas parte de él.'
            : 'No se pudo cargar el grupo. ¿Está encendido el backend?',
        );
        this.cargando.set(false);
      },
    });
  }

  
  etiqueta(categoria: string): string {
    return this.categorias.find((c) => c.valor === categoria)?.texto ?? categoria;
  }

  invalido(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }



  private ejecutar(accion: Observable<GrupoDetalle>, alTerminar?: () => void): void {
    this.mensaje.set('');
    accion.subscribe({
      next: (g) => {
        this.grupo.set(g);
        alTerminar?.();
      },
      error: (err: HttpErrorResponse) => this.mensaje.set(this.textoError(err)),
    });
  }

 
  private textoError(err: HttpErrorResponse): string {
    const detalle = err.error?.detail;
    if (typeof detalle === 'string') {
      return detalle;
    }
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    return 'Revisa los datos: alguno no es válido.';
  }


  invitar(): void {
    if (this.formInvitar.invalid) {
      this.formInvitar.markAllAsTouched();
      return;
    }
    const { email, porcentaje } = this.formInvitar.getRawValue();
    this.ejecutar(this.gruposService.invitar(this.id, email.trim(), Number(porcentaje)), () =>
      this.formInvitar.reset(),
    );
  }

  cambiarPorcentaje(miembro: Miembro, valor: string): void {
    const porcentaje = Number(valor);
    if (valor.trim() === '' || Number.isNaN(porcentaje)) {
      this.mensaje.set('Escribe un porcentaje válido (entre 0 y 100).');
      return;
    }
    this.ejecutar(this.gruposService.cambiarPorcentaje(this.id, miembro.usuario_id, porcentaje));
  }

  anadirGasto(): void {
    if (this.formGasto.invalid) {
      this.formGasto.markAllAsTouched();
      return;
    }
    const { categoria, concepto, importe } = this.formGasto.getRawValue();
    this.ejecutar(
      this.gruposService.anadirGasto(this.id, {
        categoria,
        concepto: concepto.trim(),
        importe: Number(importe),
      }),
      () => this.formGasto.reset(),
    );
  }

  borrarGasto(gastoId: number, concepto: string): void {
    if (confirm(`¿Borrar el gasto "${concepto}"?`)) {
      this.ejecutar(this.gruposService.borrarGasto(this.id, gastoId));
    }
  }

  anotarPago(): void {
    if (this.formPago.invalid) {
      this.formPago.markAllAsTouched();
      return;
    }
    const { usuario_id, importe, nota } = this.formPago.getRawValue();
    this.ejecutar(
      this.gruposService.anotarPago(this.id, {
        usuario_id: Number(usuario_id),
        importe: Number(importe),
        nota: nota.trim(),
      }),
      () => this.formPago.reset(),
    );
  }

  borrarPago(pagoId: number): void {
    if (confirm('¿Borrar este pago?')) {
      this.ejecutar(this.gruposService.borrarPago(this.id, pagoId));
    }
  }
}