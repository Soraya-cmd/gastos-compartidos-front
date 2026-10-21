import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { Grupos } from './pages/grupos/grupos';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'grupos' },
  { path: 'login', component: Login },
  { path: 'registro', component: Register },
  { path: 'grupos', component: Grupos, canActivate: [authGuard] },
  { path: '**', redirectTo: 'grupos' },
];