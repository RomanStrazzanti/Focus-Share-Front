import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./app').then(m => m.App),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.LoginComponent),
  },
  {
    path: 'timer',
    loadComponent: () => import('./timer/timer').then(m => m.TimerComponent),
  },
];
