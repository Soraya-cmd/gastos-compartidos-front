import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { DetalleGrupo } from './pages/detalle-grupo/detalle-grupo';
import { Grupos } from './pages/grupos/grupos';
import { Login } from './pages/login/login';
import { NuevoGrupo } from './pages/nuevo-grupo/nuevo-grupo';
import { Register } from './pages/register/register';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'grupos' },
  { path: 'login', component: Login },
  { path: 'registro', component: Register },
  { path: 'grupos', component: Grupos, canActivate: [authGuard] },
  { path: 'grupos/nuevo', component: NuevoGrupo, canActivate: [authGuard] },
  { path: 'grupos/:id', component: DetalleGrupo, canActivate: [authGuard] },
  { path: '**', redirectTo: 'grupos' },
];