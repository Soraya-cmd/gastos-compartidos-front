import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { Categoria, GrupoDetalle, GruposService, Mensaje, Miembro } from '../../core/grupos.service';

@Component({
  selector: 'app-detalle-grupo',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DecimalPipe, DatePipe],
  templateUrl: './detalle-grupo.html',
  styleUrl: './detalle-grupo.css',
})
export class DetalleGrupo {
  private fb = inject(FormBuilder);
  private gruposService = inject(GruposService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  
  private id = Number(this.route.snapshot.paramMap.get('id'));

  grupo = signal<GrupoDetalle | null>(null);
  cargando = signal(true);
  errorCarga = signal('');
  mensaje = signal(''); 

  
  mensajes = signal<Mensaje[]>([]);
  cargandoChat = signal(false);
  enviando = signal(false);
  errorChat = signal('');
  texto = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] });

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
        this.sugerirPorcentaje();
        this.cargando.set(false);
        
        this.cargarMensajes();
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

  
  private sugerirPorcentaje(): void {
    const g = this.grupo();
    const control = this.formInvitar.controls.porcentaje;
    if (!g || control.dirty) {
      return;
    }
    const libre = Math.round((100 - g.porcentaje_asignado) * 100) / 100;
    control.setValue(libre > 0 ? libre : null);
  }

  
  private ejecutar(accion: Observable<GrupoDetalle>, alTerminar?: () => void): void {
    this.mensaje.set('');
    accion.subscribe({
      next: (g) => {
        this.grupo.set(g);
        alTerminar?.();
        this.sugerirPorcentaje();
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

  
  
  esMio(m: Mensaje): boolean {
    return m.usuario_id === this.auth.usuario()?.id;
  }

  
  cargarMensajes(): void {
    this.errorChat.set('');
    this.cargandoChat.set(true);
    this.gruposService.listarMensajes(this.id).subscribe({
      next: (lista) => {
        this.mensajes.set(lista);
        this.cargandoChat.set(false);
        this.bajarAlFinal();
      },
      error: () => {
        this.errorChat.set('No se pudieron cargar los mensajes.');
        this.cargandoChat.set(false);
      },
    });
  }

  enviarMensaje(): void {
    const contenido = this.texto.value.trim();
    if (!contenido || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.errorChat.set('');
    this.gruposService.enviarMensaje(this.id, contenido).subscribe({
      next: () => {
        this.texto.reset();
        this.enviando.set(false);
        this.cargarMensajes(); // recargamos para ver el mensaje nuevo
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorChat.set(this.textoError(err));
      },
    });
  }

  
  private bajarAlFinal(): void {
    setTimeout(() => {
      const lista = document.getElementById('lista-mensajes');
      if (lista) {
        lista.scrollTop = lista.scrollHeight;
      }
    });
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

  repartirIgual(): void {
    if (confirm('Se repartirá el 100 % a partes iguales entre todos los miembros. ¿Continuar?')) {
      this.ejecutar(this.gruposService.repartirIgual(this.id));
    }
  }

  quitarMiembro(miembro: Miembro): void {
    if (confirm(`¿Quitar a ${miembro.nombre} del grupo?`)) {
      this.ejecutar(this.gruposService.quitarMiembro(this.id, miembro.usuario_id));
    }
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