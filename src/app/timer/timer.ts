// src/app/timer/timer.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AudioService } from '../services/audio/audio'; // Assurez-vous du bon chemin

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.html',
  styleUrls: ['./timer.css']
})
export class TimerComponent implements OnInit, OnDestroy {
  timeLeft: number = 0;
  timerActive: boolean = false;
  timerSubscription: Subscription | null = null;

  private readonly AMBIENCE_SOUND_PATH = 'assets/ambiance.mp3';

  constructor(
    protected audioService: AudioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.audioService.loadAudio(this.AMBIENCE_SOUND_PATH);
    this.audioService.setVolume(0.5);
  }

  startTimer(durationInSeconds?: number): void {
    // Si le timer est déjà actif et que nous n'essayons pas de le démarrer avec une nouvelle durée,
    // on ne fait rien (ex: clic sur "Démarrer travail" alors qu'il est déjà en cours)
    if (this.timerActive && durationInSeconds === undefined) {
      console.warn('Timer is already active. No new duration provided for restart.');
      return;
    }

    // Si une nouvelle durée est fournie, on réinitialise timeLeft.
    // Sinon, on continue avec timeLeft tel quel (pour la reprise).
    if (durationInSeconds !== undefined) {
      this.timeLeft = durationInSeconds;
    }
    // Si la durée n'est pas fournie et que timeLeft est 0, c'est une tentative de reprendre un timer inexistant.
    if (this.timeLeft === 0) {
        console.warn('Cannot start or resume timer with 0 seconds remaining.');
        return;
    }

    this.timerActive = true;           // Marquer timer comme actif
    this.audioService.play();          // Démarrer la musique

    console.log(`Timer starting/resuming. Time left: ${this.timeLeft} seconds.`);

    // Annuler l'ancien abonnement pour éviter les multiples timers concurrents
    this.timerSubscription?.unsubscribe();

    this.timerSubscription = interval(1000)
      .pipe(
        takeWhile(() => this.timeLeft > 0) // Le timer continue tant qu'il reste du temps
      )
      .subscribe({
        next: () => {
          this.timeLeft--; // Décrémenter le temps
          this.cdr.detectChanges(); // Forcer la détection de changements pour l'affichage
          console.log(`Time left: ${this.timeLeft}s`); // Gardez ce log pour le débogage

          if (this.timeLeft <= 0) {
            this.stopTimer(); // Arrêter le timer et la musique quand le temps est écoulé
            console.log('Timer finished!');
          }
        },
        error: (err) => {
          console.error('Error in timer subscription:', err);
          this.stopTimer(); // Arrêter en cas d'erreur
        },
        complete: () => {
          console.log('Timer observable completed.');
        }
      });
  }

  pauseTimer(): void {
    if (this.timerActive) {
      this.timerActive = false;
      this.timerSubscription?.unsubscribe();
      this.audioService.pause();
      console.log('Timer paused.');
      this.cdr.detectChanges();
    }
  }

  stopTimer(): void {
    this.timerActive = false;
    this.timeLeft = 0;
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = null;
    this.audioService.stop();
    console.log('Timer stopped and reset.');
    this.cdr.detectChanges();
  }

  // Nouvelle méthode pour basculer entre Pause et Reprendre
  togglePausePlay(): void {
    if (this.timerActive) {
      this.pauseTimer();
    } else {
      // Reprendre le timer avec le temps restant actuel
      this.startTimer(); // Appel sans argument, utilisera this.timeLeft actuel
    }
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