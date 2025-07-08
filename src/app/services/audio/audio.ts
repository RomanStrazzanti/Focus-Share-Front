// src/app/services/audio.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audio: HTMLAudioElement | undefined;
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  isPlaying$: Observable<boolean> = this.isPlayingSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.audio = new Audio();
      this.audio.loop = true;

      this.audio.onplay = () => this.isPlayingSubject.next(true);
      this.audio.onpause = () => this.isPlayingSubject.next(false);
      this.audio.onended = () => this.isPlayingSubject.next(false);
    } else {
      console.warn('AudioService: Not running in a browser environment. Audio functions will be disabled.');
    }
  }

  loadAudio(src: string): void {
    if (this.audio && this.audio.src !== src) {
      this.audio.src = src;
      this.audio.load();
      console.log(`Audio chargé : ${src}`);
    } else if (!this.audio) {
      console.warn('Audio object not available. Cannot load audio.');
    }
  }

  async play(): Promise<void> {
    if (this.audio) {
      if (!this.audio.src) {
        console.warn('No audio file loaded. Cannot play.');
        return;
      }
      if (this.audio.paused === false && this.audio.ended === false) {
        console.log('Audio already playing.');
        return;
      }

      try {
        await this.audio.play();
        console.log('Lecture audio démarrée.');
      } catch (error) {
        console.error('Erreur lors de la tentative de lecture audio :', error);
      }
    } else {
      console.warn('Audio object not available. Cannot play audio.');
    }
  }

  pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      console.log('Lecture audio mise en pause.');
    }
  }

  stop(): void {
    if (this.audio && (this.audio.paused === false || this.audio.ended === false)) {
      this.audio.pause();
      this.audio.currentTime = 0;
      console.log('Lecture audio arrêtée et réinitialisée.');
    }
  }

  setVolume(volume: number): void {
    if (this.audio && volume >= 0 && volume <= 1) {
      this.audio.volume = volume;
      console.log(`Volume audio défini à : ${volume}`);
    } else if (!this.audio) {
      console.warn('Audio object not available. Cannot set volume.');
    } else {
      console.warn('Le volume doit être entre 0 et 1.');
    }
  }

  getVolume(): number {
    return this.audio ? this.audio.volume : 0;
  }
}