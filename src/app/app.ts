// src/app/app.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Nécessaire pour les directives communes
import { RouterOutlet } from '@angular/router'; // Si vous utilisez le routing dans app.html
import { TimerComponent } from './timer/timer'; // <-- Assurez-vous que le chemin et le nom sont corrects

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, // Fournit des directives comme *ngIf, *ngFor, et les pipes comme async
    RouterOutlet, // Si vous utilisez <router-outlet> dans app.html
    TimerComponent // Votre composant Timer doit être importé ici pour être utilisé dans app.html
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'AppAngular';
}