// src/app/timer/timer.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription, interval, of } from 'rxjs';
import { takeWhile, delay } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AudioService } from '../services/audio/audio'; // Chemin d'importation de l'AudioService

// Mock User Settings Service
interface UserSettings {
  defaultSessionDuration: number;
}

export class MockUserSettingsService {
  getUserSettings() {
    return of({ defaultSessionDuration: 1800 }).pipe(delay(500));
  }
}

interface Sound {
  name: string;
  path: string;
  iconPath: string;
}

interface SessionDuration {
  label: string;
  value: number;
}

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.html',
  styleUrls: ['./timer.css'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class TimerComponent implements OnInit, OnDestroy {
  timeLeft: number = 0;
  timerActive: boolean = false;
  timerSubscription: Subscription | null = null;
  hasStartedOnce: boolean = false; // Indique si le minuteur a déjà été lancé au moins une fois dans sa session actuelle

  currentVolume: number = 0.5;

  availableDurations: SessionDuration[] = [
    { label: '5 minutes', value: 300 },
    { label: '10 minutes', value: 600 },
    { label: '15 minutes', value: 900 },
    { label: '20 minutes', value: 1200 },
    { label: '25 minutes', value: 1500 },
    { label: '30 minutes', value: 1800 },
    { label: '45 minutes', value: 2700 },
    { label: '1 heure', value: 3600 },
  ];

  selectedDurationValue: number = 1500;

  availableSounds: Sound[] = [
    {
      name: 'Calm Mind',
      path: 'assets/sounds/Calm_Mind.mp3',
      iconPath: 'assets/img/Calm_Mind.png',
    },
    {
      name: 'Foret',
      path: 'assets/sounds/Foret.mp3',
      iconPath: 'assets/img/Foret.png',
    },
    {
      name: 'Guitar',
      path: 'assets/sounds/Guitar.mp3',
      iconPath: 'assets/img/Guitar.png',
    },
    {
      name: 'Mind Relaxation',
      path: 'assets/sounds/Mind_Relaxation.mp3',
      iconPath: 'assets/img/Mind_Relaxation.png',
    },
    {
      name: 'Oiseaux',
      path: 'assets/sounds/Oiseaux.mp3',
      iconPath: 'assets/img/Oiseaux.png',
    },
    {
      name: 'Pluie',
      path: 'assets/sounds/Pluie.mp3',
      iconPath: 'assets/img/Pluie.png',
    },
    {
      name: 'Ruisseau',
      path: 'assets/sounds/Ruisseau.mp3',
      iconPath: 'assets/img/Ruisseau.png',
    },
    {
      name: 'Summer',
      path: 'assets/sounds/Summer.mp3',
      iconPath: 'assets/img/Summer.png',
    },
    {
      name: 'Vagues',
      path: 'assets/sounds/Vagues.mp3',
      iconPath: 'assets/img/Vagues.png',
    },
    {
      name: 'Vent',
      path: 'assets/sounds/Vent.mp',
      iconPath: 'assets/img/Vent.png',
    },
  ];

  selectedSound: Sound | null = null;

  constructor(
    protected audioService: AudioService,
    private cdr: ChangeDetectorRef,
    private userSettingsService: MockUserSettingsService
  ) {}

  ngOnInit(): void {
    this.userSettingsService.getUserSettings().subscribe((settings) => {
      const userDefault = this.availableDurations.find(
        (d) => d.value === settings.defaultSessionDuration
      );
      if (userDefault) {
        this.selectedDurationValue = userDefault.value;
      } else {
        this.selectedDurationValue = this.availableDurations[0].value;
      }
      this.timeLeft = this.selectedDurationValue; // Initialise le temps avec la durée sélectionnée
      this.cdr.detectChanges();
    });

    if (this.availableSounds.length > 0) {
      this.selectSound(this.availableSounds[0]);
    } else {
      this.selectedSound = null;
    }
    this.audioService.setVolume(this.currentVolume);
  }

  onDurationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDurationValue = parseFloat(target.value);

    // Si le minuteur n'est pas actif ET le temps restant est à 0 (état "Commencer"),
    // on met à jour timeLeft pour préparer le prochain démarrage.
    // Si le minuteur est actif (en cours) ou en pause avec du temps restant, on ne change pas timeLeft.
    if (!this.timerActive && this.timeLeft === 0) {
      this.timeLeft = this.selectedDurationValue;
    }
    this.cdr.detectChanges();
  }

  onVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newVolume = parseFloat(target.value);
    this.currentVolume = newVolume;
    this.audioService.setVolume(newVolume);
    this.cdr.detectChanges();
  }

  selectSound(sound: Sound | null): void {
    if (sound === null) {
      if (this.selectedSound !== null) {
        this.selectedSound = null;
        this.audioService.stop();
      }
    } else {
      if (this.selectedSound?.path !== sound.path) {
        this.selectedSound = sound;
        this.audioService.stop();
        this.audioService.loadAudio(this.selectedSound.path);
      }
    }
    this.cdr.detectChanges();
  }

  // MODIFICATION ICI: startTimer()
  startTimer(durationInSeconds?: number): void {
    // Si le minuteur est déjà actif et qu'on n'essaie pas de le redémarrer avec une nouvelle durée explicite, on ne fait rien.
    if (this.timerActive && durationInSeconds === undefined) {
      return;
    }

    // Détermine la durée effective à utiliser :
    // - Si une durée est passée en argument (ex: pour un bouton spécifique), on l'utilise.
    // - Sinon, si le minuteur est à 0 (état initial ou après un "Arrêter"), on utilise la durée sélectionnée.
    // - Sinon (timeLeft > 0 et pas de durée explicite), c'est une reprise, et timeLeft garde sa valeur actuelle.
    let effectiveDuration = this.timeLeft; // Par défaut, garde le temps restant (pour une reprise)
    if (durationInSeconds !== undefined) {
      // Si une durée explicite est donnée
      effectiveDuration = durationInSeconds;
    } else if (this.timeLeft === 0) {
      // Si le timer est à 0 et pas de durée explicite, c'est un nouveau départ
      effectiveDuration = this.selectedDurationValue;
    }

    // Si après toutes les initialisations, timeLeft est toujours 0, on ne peut pas démarrer.
    if (effectiveDuration === 0) {
      console.warn(
        'Impossible de démarrer le minuteur avec 0 secondes restantes.'
      );
      return;
    }

    this.timeLeft = effectiveDuration; // Assure que timeLeft est bien défini
    this.timerActive = true;
    this.hasStartedOnce = true; // Le minuteur a démarré au moins une fois

    if (this.selectedSound) {
      this.audioService.play();
    }

    this.timerSubscription?.unsubscribe(); // Annule l'abonnement précédent si existant

    this.timerSubscription = interval(1000)
      .pipe(takeWhile(() => this.timeLeft > 0))
      .subscribe({
        next: () => {
          this.timeLeft--;
          this.cdr.detectChanges(); // C'est cette ligne qui met à jour l'affichage du temps

          if (this.timeLeft <= 0) {
            this.stopTimer();
          }
        },
        error: (err) => {
          console.error("Erreur dans l'abonnement du minuteur:", err);
          this.stopTimer();
        },
        complete: () => {},
      });
  }

  pauseTimer(): void {
    if (this.timerActive) {
      this.timerActive = false;
      this.timerSubscription?.unsubscribe();
      if (this.selectedSound) {
        this.audioService.pause();
      }
      this.cdr.detectChanges();
    }
  }

  // MODIFICATION ICI: stopTimer()
  stopTimer(): void {
    this.timerActive = false;
    this.timeLeft = 0; // Crucial: Réinitialise le temps à 0 pour le bouton "Commencer"
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = null;
    if (this.selectedSound) {
      this.audioService.stop();
    }
    this.hasStartedOnce = false; // Réinitialise l'état "a déjà démarré"
    this.cdr.detectChanges();
  }

  // MODIFICATION ICI: togglePausePlay()
  togglePausePlay(): void {
    if (this.timerActive) {
      this.pauseTimer();
    } else {
      // Si le minuteur est à 0 (vraiment à 0) OU s'il n'a jamais démarré pour cette session,
      // c'est un nouveau départ.
      if (this.timeLeft === 0 || !this.hasStartedOnce) {
        this.startTimer(this.selectedDurationValue); // Nouveau départ avec la durée sélectionnée
      } else {
        this.startTimer(); // Reprend là où il était (this.timeLeft > 0)
      }
    }
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
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
