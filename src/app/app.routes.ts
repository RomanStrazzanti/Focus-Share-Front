import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', redirectTo: '/home', pathMatch: 'full' 
  },
  {
    path: '',
    loadComponent: () => import('./app').then(m => m.App),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.LoginComponent),
  },
  {
    path: 'timer',
    loadComponent: () => import('./timer/timer').then(m => m.TimerComponent),
  },
  {
    path: 'forum',
    loadComponent: () => import('./forum/forum').then(m => m.ForumComponent),
  },
  {
    path: 'messages',
    loadComponent: () => import('./messages/messages').then(m => m.MessagesComponent),
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat').then(m => m.ChatComponent),
  },
  { 
    path: 'tasks',
    loadComponent: () => import('./tasks/tasks').then(m => m.TasksComponent),
  },
  {
    path: 'create-user',
    loadComponent: () => import('./create-user/create-user').then(m => m.CreateUserComponent),
  }
];
