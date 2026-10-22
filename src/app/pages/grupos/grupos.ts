import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GrupoResumen, GruposService } from '../../core/grupos.service';

@Component({
  selector: 'app-grupos',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './grupos.html',
  styleUrl: './grupos.css',
})
export class Grupos {
  private gruposService = inject(GruposService);

  grupos = signal<GrupoResumen[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor() {
   
    this.gruposService.listar().subscribe({
      next: (lista) => {
        this.grupos.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los grupos. ¿Está encendido el backend?');
        this.cargando.set(false);
      },
    });
  }
}