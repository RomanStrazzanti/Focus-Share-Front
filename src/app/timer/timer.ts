// src/app/timer/timer.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AudioService } from '../services/audio/audio';

// Interface pour définir la structure d'un son
interface Sound {
  name: string; // Nom affiché (ex: "Bruit de Pluie")
  path: string; // Chemin vers le fichier (ex: "assets/sons/pluie.mp3")
}

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

  currentVolume: number = 0.5;

  availableSounds: Sound[] = [
    { name: 'Calm Mind', path: 'assets/Calm_Mind.mp3' },
    { name: 'Foret', path: 'assets/Foret.mp3' },
    { name: 'Guitar', path: 'assets/Guitar.mp3' },
    { name: 'Mind Relaxation', path: 'assets/Mind_Relaxation.mp3' },
    { name: 'Oiseaux', path: 'assets/Oiseaux.mp3' },
    { name: 'Pluie', path: 'assets/Pluie.mp3' },
    { name: 'Ruisseau', path: 'assets/Ruisseau.mp3' },
    { name: 'Summer', path: 'assets/Summer.mp3' },
    { name: 'Vagues', path: 'assets/Vagues.mp3' },
    { name: 'Vent', path: 'assets/Vent.mp3' },
  ];

  selectedSound: Sound | null = null; // Peut être null si "Aucun son" est sélectionné

  constructor(
    protected audioService: AudioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Sélectionne le premier son par défaut ou aucun si la liste est vide
    if (this.availableSounds.length > 0) {
      this.selectSound(this.availableSounds[0]);
    } else {
      this.selectedSound = null; // Aucun son par défaut si la liste est vide
    }
    this.audioService.setVolume(this.currentVolume);
  }

  onVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newVolume = parseFloat(target.value);
    this.currentVolume = newVolume;
    this.audioService.setVolume(newVolume);
    console.log(`Volume réglé à: ${newVolume}`);
  }

  /**
   * Sélectionne un son et le charge dans le service audio.
   * Si 'null' est passé, aucun son n'est sélectionné.
   * @param sound L'objet Sound à sélectionner, ou null pour désactiver le son.
   */
  selectSound(sound: Sound | null): void { // Le paramètre peut maintenant être null
    if (sound === null) {
      // Si on veut aucun son
      if (this.selectedSound !== null) { // Seulement si un son était précédemment sélectionné
        this.selectedSound = null;
        this.audioService.stop(); // Arrête le son immédiatement
        console.log('Aucun son sélectionné.');
      }
    } else {
      // Si un son est sélectionné
      if (this.selectedSound?.path !== sound.path) {
        this.selectedSound = sound;
        this.audioService.stop(); // Arrête le son précédent si en lecture
        this.audioService.loadAudio(this.selectedSound.path);
        console.log(`Son sélectionné : ${sound.name}`);
      }
    }
    // Forcer la détection de changements pour mettre à jour la sélection de bouton
    this.cdr.detectChanges();
  }

  startTimer(durationInSeconds?: number): void {
    // Le timer peut démarrer même sans son, mais on log un avertissement
    if (!this.selectedSound) {
      console.warn('Démarrage du timer sans son d\'ambiance sélectionné.');
    }

    if (this.timerActive && durationInSeconds === undefined) {
      console.warn('Timer is already active. No new duration provided for restart.');
      return;
    }

    if (durationInSeconds !== undefined) {
      this.timeLeft = durationInSeconds;
    }
    if (this.timeLeft === 0) {
        console.warn('Cannot start or resume timer with 0 seconds remaining.');
        return;
    }

    this.timerActive = true;
    // Joue le son SEULEMENT si un son est sélectionné
    if (this.selectedSound) {
      this.audioService.play();
    }
    console.log(`Timer starting/resuming. Time left: ${this.timeLeft} seconds.`);

    this.timerSubscription?.unsubscribe();

    this.timerSubscription = interval(1000)
      .pipe(
        takeWhile(() => this.timeLeft > 0)
      )
      .subscribe({
        next: () => {
          this.timeLeft--;
          this.cdr.detectChanges();
          console.log(`Time left: ${this.timeLeft}s`);

          if (this.timeLeft <= 0) {
            this.stopTimer();
            console.log('Timer finished!');
          }
        },
        error: (err) => {
          console.error('Error in timer subscription:', err);
          this.stopTimer();
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
      // Met en pause le son SEULEMENT si un son est sélectionné
      if (this.selectedSound) {
        this.audioService.pause();
      }
      console.log('Timer paused.');
      this.cdr.detectChanges();
    }
  }

  stopTimer(): void {
    this.timerActive = false;
    this.timeLeft = 0;
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = null;
    // Arrête le son SEULEMENT si un son était sélectionné
    if (this.selectedSound) {
      this.audioService.stop();
    }
    console.log('Timer stopped and reset.');
    this.cdr.detectChanges();
  }

  togglePausePlay(): void {
    if (this.timerActive) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
    // Arrête le son lors de la destruction du composant SEULEMENT si un son était sélectionné
    if (this.selectedSound) {
      this.audioService.stop();
    }
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