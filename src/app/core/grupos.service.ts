import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from './config';

export type Categoria = 'cena' | 'alojamiento' | 'actividades' | 'transporte' | 'otros';


export interface GrupoResumen {
  id: number;
  titulo: string;
  descripcion: string;
  total: number;
  rol: 'creador' | 'invitado';
}

export interface Gasto {
  id: number;
  concepto: string;
  categoria: Categoria;
  importe: number;
}

export interface Miembro {
  usuario_id: number;
  nombre: string;
  email: string;
  es_creador: boolean;
  porcentaje: number;
  debe: number;
  pagado: number;
  pendiente: number;
}

export interface Pago {
  id: number;
  usuario_id: number;
  nombre: string;
  importe: number;
  fecha: string;
  nota: string | null;
}

export interface GrupoDetalle {
  id: number;
  titulo: string;
  descripcion: string;
  creador_id: number;
  soy_creador: boolean;
  total: number;
  porcentaje_asignado: number;
  reparto_completo: boolean;
  total_pagado: number;
  total_pendiente: number;
  gastos: Gasto[];
  miembros: Miembro[];
  pagos: Pago[];
}

export interface GastoNuevo {
  concepto: string;
  categoria: Categoria;
  importe: number;
}

export interface GrupoNuevo {
  titulo: string;
  descripcion: string;
  gastos: GastoNuevo[];
}

export interface PagoNuevo {
  usuario_id: number;
  importe: number;
  fecha?: string;
  nota?: string;
}

@Injectable({ providedIn: 'root' })
export class GruposService {
  private http = inject(HttpClient);
  private base = `${API_URL}/grupos`;

  listar(): Observable<GrupoResumen[]> {
    return this.http.get<GrupoResumen[]>(this.base);
  }

  detalle(id: number): Observable<GrupoDetalle> {
    return this.http.get<GrupoDetalle>(`${this.base}/${id}`);
  }

  crear(datos: GrupoNuevo): Observable<GrupoDetalle> {
    return this.http.post<GrupoDetalle>(this.base, datos);
  }

  invitar(id: number, email: string, porcentaje: number): Observable<GrupoDetalle> {
    return this.http.post<GrupoDetalle>(`${this.base}/${id}/miembros`, { email, porcentaje });
  }

  cambiarPorcentaje(id: number, usuarioId: number, porcentaje: number): Observable<GrupoDetalle> {
    return this.http.put<GrupoDetalle>(`${this.base}/${id}/miembros/${usuarioId}`, { porcentaje });
  }

  anadirGasto(id: number, gasto: GastoNuevo): Observable<GrupoDetalle> {
    return this.http.post<GrupoDetalle>(`${this.base}/${id}/gastos`, gasto);
  }

  borrarGasto(id: number, gastoId: number): Observable<GrupoDetalle> {
    return this.http.delete<GrupoDetalle>(`${this.base}/${id}/gastos/${gastoId}`);
  }

  anotarPago(id: number, pago: PagoNuevo): Observable<GrupoDetalle> {
    return this.http.post<GrupoDetalle>(`${this.base}/${id}/pagos`, pago);
  }

  borrarPago(id: number, pagoId: number): Observable<GrupoDetalle> {
    return this.http.delete<GrupoDetalle>(`${this.base}/${id}/pagos/${pagoId}`);
  }
}