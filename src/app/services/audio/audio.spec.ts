import { TestBed } from '@angular/core/testing';
// Correction ici : importer AudioService depuis './audio.service'
import { AudioService } from './audio'; // <-- Chemin corrigé et nom d'importation correct

describe('AudioService', () => { // Le nom de la suite de tests devrait correspondre au service
  let service: AudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    // Correction ici : injecter AudioService, pas 'Audio'
    service = TestBed.inject(AudioService); // <-- Injection correcte du service
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});