import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';

import { API_URL } from './config';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface TokenRespuesta {
  access_token: string;
  token_type: string;
}

const CLAVE_TOKEN = 'gastos_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

 
  private _token = signal<string | null>(localStorage.getItem(CLAVE_TOKEN));


  readonly estaLogueado = computed(() => this._token() !== null);

  
  readonly usuario = signal<Usuario | null>(null);

  
  get token(): string | null {
    return this._token();
  }

  registro(datos: { nombre: string; email: string; password: string }): Observable<Usuario> {
    return this.http.post<Usuario>(`${API_URL}/auth/registro`, datos);
  }

 
  login(email: string, password: string): Observable<Usuario> {
    return this.http.post<TokenRespuesta>(`${API_URL}/auth/login`, { email, password }).pipe(
      tap((resp) => {
        localStorage.setItem(CLAVE_TOKEN, resp.access_token);
        this._token.set(resp.access_token);
      }),
      switchMap(() => this.cargarUsuario()),
    );
  }

 
  cargarUsuario(): Observable<Usuario> {
    return this.http
      .get<Usuario>(`${API_URL}/auth/yo`)
      .pipe(tap((usuario) => this.usuario.set(usuario)));
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    this._token.set(null);
    this.usuario.set(null);
    this.router.navigate(['/login']);
  }
}