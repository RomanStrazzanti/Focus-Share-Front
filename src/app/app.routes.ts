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
  {path: 'todolist',
    loadComponent: () => import('./todo-list/todo-list').then(m => m.TodoListComponent),
  },
];
