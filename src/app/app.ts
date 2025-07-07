// app.ts

import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router'; // <-- REMOVE THIS LINE if not used
import { CommonModule } from '@angular/common';
import { TimerComponent } from './timer/timer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // RouterOutlet, // <-- REMOVE RouterOutlet from here too
    CommonModule,
    TimerComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'AppAngular';
}