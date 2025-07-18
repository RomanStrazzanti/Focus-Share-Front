// src/app/app.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router'; // À garder si vous utilisez <router-outlet> dans app.html
import { TimerComponent } from './timer/timer'; // Assurez-vous du bon chemin et du nom du fichier
import { HeaderComponent } from './header/header';
import { TasksComponent } from './tasks/tasks';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, 
    //TimerComponent,
    HeaderComponent,
    //TasksComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'AppAngular';
}