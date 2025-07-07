// src/app/timer/timer.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { CommonModule } from '@angular/common'; // <-- ADD THIS IMPORT for CommonModule
import { AudioService } from '../services/audio/audio';

@Component({
  selector: 'app-timer',
  standalone: true, // Assuming it's a standalone component
  imports: [CommonModule], // <-- ADD CommonModule to imports here
  templateUrl: './timer.html', // Note: your error message says timer.html, not timer.component.html
  styleUrls: ['./timer.css']
})
export class TimerComponent implements OnInit, OnDestroy {
  timeLeft: number = 0;
  timerActive: boolean = false;
  timerSubscription: Subscription | null = null;

  private readonly AMBIENCE_SOUND_PATH = 'assets/ambiance.mp3';

  // CHANGE 'private' to 'protected' or 'public'
  // 'protected' is often a good default when a property needs to be accessed from the template.
  constructor(protected audioService: AudioService) {} // <-- CHANGE 'private' to 'protected'

  // ... rest of your TimerComponent methods (startTimer, pauseTimer, etc.)
  // The rest of the code you have for startTimer, pauseTimer, stopTimer,
  // ngOnInit, ngOnDestroy, formatTime, padZero should remain the same.
  // Just make sure the 'templateUrl' matches your actual HTML filename (timer.html or timer.component.html)

  ngOnInit(): void {
    this.audioService.loadAudio(this.AMBIENCE_SOUND_PATH);
    this.audioService.setVolume(0.5);
  }

  // ... (startTimer, pauseTimer, stopTimer, ngOnDestroy, formatTime, padZero methods as before)
  startTimer(durationInSeconds: number): void {
    if (this.timerActive) { return; }
    this.timeLeft = durationInSeconds;
    this.timerActive = true;
    this.audioService.play();
    this.timerSubscription = interval(1000).pipe(
      takeWhile(() => this.timeLeft > 0)
    ).subscribe(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.stopTimer();
        console.log('Timer terminé !');
      }
    });
  }

  pauseTimer(): void {
    if (this.timerActive) {
      this.timerActive = false;
      this.timerSubscription?.unsubscribe();
      this.audioService.pause();
      console.log('Timer mis en pause.');
    }
  }

  stopTimer(): void {
    this.timerActive = false;
    this.timeLeft = 0;
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = null;
    this.audioService.stop();
    console.log('Timer arrêté.');
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
    this.audioService.stop();
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${this.padZero(minutes)}:${this.padZero(remainingSeconds)}`;
  }

  private padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
}