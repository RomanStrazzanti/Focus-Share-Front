// src/app/timer/timer.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimerComponent, MockUserSettingsService } from './timer'; // Importe le composant et le mock service
import { AudioService } from '../services/audio/audio'; // Importe le vrai service AudioService
import { of } from 'rxjs';

// Décrit la suite de tests pour le TimerComponent
describe('TimerComponent', () => {
  let component: TimerComponent; // Instance du composant à tester
  let fixture: ComponentFixture<TimerComponent>; // Fixture pour interagir avec le DOM du composant
  let mockAudioService: any; // Une version simulée de l'AudioService

  // Ce bloc s'exécute avant chaque test
  beforeEach(async () => {
    // Création d'un mock (simulation) pour AudioService
    // Cela nous permet de contrôler le comportement de AudioService sans dépendre d'un vrai objet Audio du navigateur
    mockAudioService = jasmine.createSpyObj('AudioService', [
      'setVolume',
      'loadAudio',
      'play',
      'pause',
      'stop',
      'isPlaying$',
    ]);
    // Simule le comportement de isPlaying$ pour les tests
    mockAudioService.isPlaying$ = of(false); // Par défaut, l'audio n'est pas en lecture

    // Configure le module de test Angular
    await TestBed.configureTestingModule({
      imports: [TimerComponent], // Importe le composant standalone à tester
      providers: [
        // Fournit une instance du MockUserSettingsService
        MockUserSettingsService,
        // Fournit notre mock de AudioService à la place du vrai AudioService
        { provide: AudioService, useValue: mockAudioService },
      ],
    }).compileComponents(); // Compile les composants pour le test

    // Crée une instance du composant et de sa fixture
    fixture = TestBed.createComponent(TimerComponent);
    component = fixture.componentInstance; // Récupère l'instance du composant
    fixture.detectChanges(); // Déclenche la détection de changements initiale (équivalent à ngOnInit)
  });

  // --- Tests de base ---
  it('devrait être créé', () => {
    expect(component).toBeTruthy(); // Vérifie que le composant est bien instancié
  });

  it('devrait initialiser timeLeft avec la durée par défaut des préférences utilisateur', () => {
    // Le mock UserSettingsService renvoie 1800 (30 minutes) par défaut
    expect(component.timeLeft).toBe(1800);
  });

  it('devrait initialiser currentVolume à 0.5', () => {
    expect(component.currentVolume).toBe(0.5);
    expect(mockAudioService.setVolume).toHaveBeenCalledWith(0.5); // Vérifie que le volume est bien défini
  });

  // --- Tests de la méthode formatTime ---
  it('formatTime devrait formater le temps correctement (moins de 10s)', () => {
    expect(component.formatTime(5)).toBe('00:05');
  });

  it('formatTime devrait formater le temps correctement (plus de 10s)', () => {
    expect(component.formatTime(15)).toBe('00:15');
  });

  it('formatTime devrait formater le temps correctement (minutes et secondes)', () => {
    expect(component.formatTime(125)).toBe('02:05');
  });

  it('formatTime devrait formater le temps correctement (heures)', () => {
    expect(component.formatTime(3600)).toBe('60:00'); // Ou '60:00' si vous ne gérez pas les heures
  });

  // --- Tests de la sélection de durée ---
  it('onDurationChange devrait mettre à jour selectedDurationValue et timeLeft si le timer est inactif', () => {
    component.timerActive = false;
    component.timeLeft = 0; // Simulate initial state
    const mockEvent = { target: { value: '600' } } as unknown as Event; // 10 minutes
    component.onDurationChange(mockEvent);
    expect(component.selectedDurationValue).toBe(600);
    expect(component.timeLeft).toBe(600);
  });

  it('onDurationChange ne devrait PAS changer timeLeft si le timer est actif', () => {
    component.timerActive = true;
    component.timeLeft = 100; // Timer en cours
    const initialTimeLeft = component.timeLeft;
    const mockEvent = { target: { value: '600' } } as unknown as Event;
    component.onDurationChange(mockEvent);
    expect(component.selectedDurationValue).toBe(600);
    expect(component.timeLeft).toBe(initialTimeLeft); // timeLeft ne devrait pas changer
  });

  // --- Tests de la sélection de son ---
  it('selectSound devrait charger et arrêter le son précédent si un nouveau son est sélectionné', () => {
    const sound1 = { name: 'Pluie', path: 'assets/Pluie.mp3', iconPath: '' };
    const sound2 = { name: 'Foret', path: 'assets/Foret.mp3', iconPath: '' };

    component.selectSound(sound1);
    expect(mockAudioService.loadAudio).toHaveBeenCalledWith(sound1.path);
    expect(component.selectedSound).toBe(sound1);

    component.selectSound(sound2);
    expect(mockAudioService.stop).toHaveBeenCalledTimes(1); // Arrête le son précédent
    expect(mockAudioService.loadAudio).toHaveBeenCalledWith(sound2.path);
    expect(component.selectedSound).toBe(sound2);
  });

  it('selectSound devrait désactiver le son si null est sélectionné', () => {
    const sound1 = { name: 'Pluie', path: 'assets/Pluie.mp3', iconPath: '' };
    component.selectSound(sound1); // Sélectionne un son d'abord
    mockAudioService.stop.calls.reset(); // Réinitialise le spy pour le test suivant

    component.selectSound(null);
    expect(mockAudioService.stop).toHaveBeenCalledTimes(1);
    expect(component.selectedSound).toBeNull();
  });

  // --- Tests des contrôles du minuteur (start, pause, stop, toggle) ---
  it('startTimer devrait démarrer le minuteur avec la durée sélectionnée si timeLeft est 0', () => {
    component.timeLeft = 0;
    component.selectedDurationValue = 60; // 1 minute
    component.startTimer();
    expect(component.timerActive).toBeTrue();
    expect(component.timeLeft).toBe(60);
    expect(component.hasStartedOnce).toBeTrue();
    expect(mockAudioService.play).toHaveBeenCalled();
  });

  it('startTimer devrait reprendre le minuteur si timeLeft est > 0 et inactif', () => {
    component.timeLeft = 30; // Minuteur en pause
    component.timerActive = false;
    component.hasStartedOnce = true; // Simule qu'il a déjà démarré
    component.startTimer();
    expect(component.timerActive).toBeTrue();
    expect(component.timeLeft).toBe(30); // Le temps ne change pas
    expect(mockAudioService.play).toHaveBeenCalled();
  });

  it('pauseTimer devrait mettre le minuteur en pause', () => {
    component.startTimer(); // Démarre le minuteur
    fixture.detectChanges();
    component.pauseTimer();
    expect(component.timerActive).toBeFalse();
    expect(component.timerSubscription).toBeNull(); // L'abonnement devrait être annulé
    expect(mockAudioService.pause).toHaveBeenCalled();
  });

  it('stopTimer devrait arrêter et réinitialiser le minuteur', () => {
    component.startTimer(); // Démarre le minuteur
    fixture.detectChanges();
    component.stopTimer();
    expect(component.timerActive).toBeFalse();
    expect(component.timeLeft).toBe(0); // Temps remis à zéro
    expect(component.timerSubscription).toBeNull();
    expect(component.hasStartedOnce).toBeFalse(); // hasStartedOnce remis à false
    expect(mockAudioService.stop).toHaveBeenCalled();
  });

  it('togglePausePlay devrait démarrer le minuteur si inactif et timeLeft est 0', () => {
    component.timeLeft = 0;
    component.hasStartedOnce = false;
    component.selectedDurationValue = 10;
    component.togglePausePlay();
    expect(component.timerActive).toBeTrue();
    expect(component.timeLeft).toBe(10);
    expect(component.hasStartedOnce).toBeTrue();
  });

  it('togglePausePlay devrait reprendre le minuteur si inactif et timeLeft est > 0', () => {
    component.timeLeft = 5;
    component.timerActive = false;
    component.hasStartedOnce = true; // Simule qu'il était en pause
    component.togglePausePlay();
    expect(component.timerActive).toBeTrue();
    expect(component.timeLeft).toBe(5); // Le temps ne change pas
  });

  it('togglePausePlay devrait mettre le minuteur en pause si actif', () => {
    component.startTimer(); // Démarre le minuteur
    fixture.detectChanges();
    component.togglePausePlay();
    expect(component.timerActive).toBeFalse();
  });

  // --- Test de la décrémentation du temps (nécessite done() pour les tests asynchrones) ---
  it('le temps devrait décrémenter chaque seconde', (done) => {
    component.timeLeft = 3; // Démarre avec 3 secondes
    component.startTimer();
    expect(component.timerActive).toBeTrue();

    // Simule le passage du temps
    setTimeout(() => {
      expect(component.timeLeft).toBe(2);
      setTimeout(() => {
        expect(component.timeLeft).toBe(1);
        setTimeout(() => {
          expect(component.timeLeft).toBe(0);
          expect(component.timerActive).toBeFalse(); // Le timer devrait s'arrêter à 0
          done(); // Indique à Jasmine que le test asynchrone est terminé
        }, 1000);
      }, 1000);
    }, 1000);
  });

  // --- Nettoyage après les tests ---
  afterEach(() => {
    // S'assure que le minuteur est arrêté après chaque test pour éviter les interférences
    if (component.timerActive) {
      component.stopTimer();
    }
    // Réinitialise les appels des spies de l'AudioService
    mockAudioService.setVolume.calls.reset();
    mockAudioService.loadAudio.calls.reset();
    mockAudioService.play.calls.reset();
    mockAudioService.pause.calls.reset();
    mockAudioService.stop.calls.reset();
  });
});
