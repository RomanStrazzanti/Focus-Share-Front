// src/app/timer/timer.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription, interval, of } from 'rxjs'; // Ajout de 'of' pour le MockUserSettingsService
import { takeWhile, delay } from 'rxjs/operators'; // Ajout de 'delay' pour le MockUserSettingsService
import { CommonModule } from '@angular/common';
import { AudioService } from '../services/audio/audio';

// --- NOUVEAU: Mock User Settings Service (À REMPLACER PAR VOTRE VRAI SERVICE PLUS TARD) ---
// Ce service est un substitut temporaire pour simuler la récupération des préférences utilisateur.
// Dans une vraie application, ce serait un fichier séparé, injectable via @Injectable().
interface UserSettings {
  defaultSessionDuration: number; // Durée par défaut en secondes
  // Ajoutez ici d'autres préférences utilisateur si nécessaire
}

// Classe simulant le service qui irait chercher les données en base de données ou via une API
// NE PAS LA LAISSER ICI DANS UN VRAI PROJET, METTEZ-LA DANS UN FICHIER SÉPARÉ user-settings.service.ts
export class MockUserSettingsService {
  // Exporté pour être fourni dans app.config.ts
  getUserSettings() {
    // Simule un appel API avec un délai pour un effet plus réaliste
    // Définit une durée par défaut de 30 minutes (1800 secondes)
    return of({ defaultSessionDuration: 1800 }).pipe(delay(500));
  }
}
// --- FIN Mock Service ---

// Interface pour définir la structure d'un son (Musique d'ambiance)
interface Sound {
  name: string; // Nom affiché (ex: "Bruit de Pluie")
  path: string; // Chemin vers le fichier (ex: "assets/sons/pluie.mp3")
}

// Interface pour définir la structure d'une option de durée de session
interface SessionDuration {
  label: string; // Libellé affiché dans la liste (ex: "25 minutes")
  value: number; // Durée correspondante en secondes
}

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule], // Pas besoin de FormsModule ici si on utilise [value] et (change)
  templateUrl: './timer.html',
  styleUrls: ['./timer.css'],
  changeDetection: ChangeDetectionStrategy.Default, // Garder Default si vous utilisez cdr.detectChanges()
})
export class TimerComponent implements OnInit, OnDestroy {
  timeLeft: number = 0;
  timerActive: boolean = false;
  timerSubscription: Subscription | null = null;

  currentVolume: number = 0.5; // Volume actuel de la musique (0.0 à 1.0)

  // Liste des durées de session prédéfinies
  availableDurations: SessionDuration[] = [
    { label: '5 minutes', value: 300 },
    { label: '10 minutes', value: 600 },
    { label: '15 minutes', value: 900 },
    { label: '20 minutes', value: 1200 },
    { label: '25 minutes', value: 1500 }, // Durée Pomodoro standard
    { label: '30 minutes', value: 1800 },
    { label: '45 minutes', value: 2700 },
    { label: '1 heure', value: 3600 },
  ];

  // La valeur de la durée de session actuellement sélectionnée par l'utilisateur
  selectedDurationValue: number = 1500; // Valeur par défaut initiale (sera écrasée par les préférences utilisateur)

  // Liste des sons d'ambiance disponibles
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

  selectedSound: Sound | null = null; // Le son d'ambiance actuellement sélectionné (peut être null pour "Aucun son")

  constructor(
    protected audioService: AudioService,
    private cdr: ChangeDetectorRef, // Pour la détection manuelle des changements avec Zoneless
    private userSettingsService: MockUserSettingsService // Injection du service de préférences utilisateur
  ) {}

  ngOnInit(): void {
    // 1. Chargement des préférences utilisateur pour la durée de session par défaut
    this.userSettingsService.getUserSettings().subscribe((settings) => {
      // Cherche si la durée par défaut de l'utilisateur existe dans notre liste prédéfinie
      const userDefault = this.availableDurations.find(
        (d) => d.value === settings.defaultSessionDuration
      );
      if (userDefault) {
        this.selectedDurationValue = userDefault.value;
        console.log(
          `Durée de session par défaut chargée des préférences: ${userDefault.label}`
        );
      } else {
        // Fallback si la préférence de l'utilisateur n'est pas dans nos options
        console.warn(
          `La durée par défaut de l'utilisateur (${settings.defaultSessionDuration}s) n'est pas trouvée dans les préréglages. Utilisation de la première option: ${this.availableDurations[0].label}`
        );
        this.selectedDurationValue = this.availableDurations[0].value;
      }
      // Initialise le temps restant du minuteur avec la durée sélectionnée
      this.timeLeft = this.selectedDurationValue;
      this.cdr.detectChanges(); // Force la mise à jour de l'UI après le chargement asynchrone
    });

    // 2. Sélection du son d'ambiance par défaut
    if (this.availableSounds.length > 0) {
      this.selectSound(this.availableSounds[0]); // Sélectionne le premier son par défaut
    } else {
      this.selectedSound = null; // Aucun son si la liste est vide
    }
    // 3. Initialise le volume de l'audio service
    this.audioService.setVolume(this.currentVolume);
  }

  /**
   * Gère le changement de la durée de session via la liste déroulante.
   * @param event L'événement de changement du `<select>`.
   */
  onDurationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDurationValue = parseFloat(target.value); // Convertit la valeur en nombre

    // Met à jour le temps restant seulement si le minuteur n'est pas actif
    // ou si le minuteur est à 0 (nouvellement arrêté ou jamais démarré)
    if (!this.timerActive || this.timeLeft === 0) {
      this.timeLeft = this.selectedDurationValue;
    }
    console.log(
      `Durée sélectionnée: ${this.selectedDurationValue / 60} minutes`
    );
    this.cdr.detectChanges(); // Force la mise à jour de l'UI
  }

  /**
   * Gère le changement de volume via le slider.
   * @param event L'événement de changement de l'input type="range".
   */
  onVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newVolume = parseFloat(target.value);
    this.currentVolume = newVolume;
    this.audioService.setVolume(newVolume);
    console.log(`Volume réglé à: ${newVolume}`);
    this.cdr.detectChanges(); // Force la mise à jour de l'UI (pour le pourcentage affiché)
  }

  /**
   * Sélectionne un son d'ambiance et le charge dans le service audio.
   * Si 'null' est passé, aucun son n'est sélectionné et la lecture est arrêtée.
   * @param sound L'objet Sound à sélectionner, ou null pour désactiver le son.
   */
  selectSound(sound: Sound | null): void {
    if (sound === null) {
      // Si on veut aucun son
      if (this.selectedSound !== null) {
        // Seulement si un son était précédemment sélectionné
        this.selectedSound = null;
        this.audioService.stop(); // Arrête le son immédiatement
        console.log('Aucun son sélectionné.');
      }
    } else {
      // Si un son est sélectionné
      if (this.selectedSound?.path !== sound.path) {
        // Charge seulement si le son change
        this.selectedSound = sound;
        this.audioService.stop(); // Arrête le son précédent si en lecture
        this.audioService.loadAudio(this.selectedSound.path);
        console.log(`Son sélectionné : ${sound.name}`);
      }
    }
    this.cdr.detectChanges(); // Force la détection de changements pour mettre à jour la sélection de bouton
  }

  /**
   * Démarre ou reprend le minuteur.
   * @param durationInSeconds Durée spécifique pour un nouveau démarrage (optionnel).
   */
  startTimer(durationInSeconds?: number): void {
    // Détermine la durée réelle à utiliser : soit un paramètre spécifique, soit la durée sélectionnée
    const actualDuration =
      durationInSeconds !== undefined
        ? durationInSeconds
        : this.selectedDurationValue;

    if (!this.selectedSound) {
      console.warn("Démarrage du minuteur sans son d'ambiance sélectionné.");
    }

    if (this.timerActive && durationInSeconds === undefined) {
      console.warn(
        'Le minuteur est déjà actif. Aucune nouvelle durée fournie pour un redémarrage.'
      );
      return;
    }

    // Initialise timeLeft si on démarre pour la première fois ou avec une nouvelle durée
    if (durationInSeconds !== undefined || this.timeLeft === 0) {
      this.timeLeft = actualDuration;
    }

    if (this.timeLeft === 0) {
      console.warn(
        'Impossible de démarrer ou reprendre le minuteur avec 0 secondes restantes.'
      );
      return;
    }

    this.timerActive = true;
    // Joue le son SEULEMENT si un son est sélectionné
    if (this.selectedSound) {
      this.audioService.play();
    }
    console.log(
      `Minuteur démarré/repris. Temps restant: ${this.timeLeft} secondes.`
    );

    this.timerSubscription?.unsubscribe(); // Annule l'abonnement précédent si existant

    this.timerSubscription = interval(1000) // Émet toutes les secondes
      .pipe(
        takeWhile(() => this.timeLeft > 0) // Continue tant que le temps est > 0
      )
      .subscribe({
        next: () => {
          this.timeLeft--; // Décrémente le temps
          this.cdr.detectChanges(); // Force la mise à jour de l'UI (avec Zoneless)
          console.log(`Temps restant: ${this.timeLeft}s`);

          if (this.timeLeft <= 0) {
            this.stopTimer(); // Arrête le minuteur quand le temps est écoulé
            console.log('Minuteur terminé !');
          }
        },
        error: (err) => {
          console.error("Erreur dans l'abonnement du minuteur:", err);
          this.stopTimer();
        },
        complete: () => {
          console.log('Observable du minuteur terminé.');
        },
      });
  }

  /**
   * Met en pause le minuteur et le son.
   */
  pauseTimer(): void {
    if (this.timerActive) {
      this.timerActive = false;
      this.timerSubscription?.unsubscribe(); // Annule l'abonnement du minuteur
      if (this.selectedSound) {
        this.audioService.pause(); // Met en pause le son
      }
      console.log('Minuteur en pause.');
      this.cdr.detectChanges();
    }
  }

  /**
   * Arrête et réinitialise le minuteur et le son.
   */
  stopTimer(): void {
    this.timerActive = false;
    this.timeLeft = 0; // Réinitialise le temps restant à 0
    this.timerSubscription?.unsubscribe(); // Annule l'abonnement
    this.timerSubscription = null; // Supprime la référence à l'abonnement
    if (this.selectedSound) {
      this.audioService.stop(); // Arrête et réinitialise le son
    }
    // Réinitialise le temps restant à la durée actuellement sélectionnée après l'arrêt
    this.timeLeft = this.selectedDurationValue;
    console.log('Minuteur arrêté et réinitialisé.');
    this.cdr.detectChanges();
  }

  /**
   * Bascule entre pause et lecture du minuteur.
   */
  togglePausePlay(): void {
    if (this.timerActive) {
      this.pauseTimer();
    } else {
      // Si le temps est déjà > 0 et qu'il n'y a pas d'abonnement actif (donc c'était en pause), on reprend
      // Sinon, on démarre une nouvelle session avec la durée sélectionnée.
      this.startTimer(
        this.timeLeft > 0 && !this.timerSubscription
          ? undefined
          : this.selectedDurationValue
      );
    }
  }

  /**
   * Gère la destruction du composant (nettoyage).
   */
  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe(); // Annule l'abonnement au minuteur
    if (this.selectedSound) {
      this.audioService.stop(); // Arrête le son si en lecture
    }
  }

  /**
   * Formate le temps en secondes en format MM:SS.
   * @param seconds Le nombre de secondes à formater.
   * @returns Le temps formaté (ex: "25:00").
   */
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${this.padZero(minutes)}:${this.padZero(remainingSeconds)}`;
  }

  /**
   * Ajoute un zéro en tête si le nombre est inférieur à 10.
   * @param num Le nombre.
   * @returns Le nombre formaté en chaîne de caractères.
   */
  private padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
}
