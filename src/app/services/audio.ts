// src/app/services/audio.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core'; // <-- Import PLATFORM_ID and Inject
import { isPlatformBrowser } from '@angular/common'; // <-- Import isPlatformBrowser
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audio: HTMLAudioElement | undefined; // Make it potentially undefined
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  isPlaying$: Observable<boolean> = this.isPlayingSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { // <-- Inject PLATFORM_ID
    // Only create the Audio object if running in a browser environment
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

  // Add checks for this.audio before calling methods on it
  /**
   * Load an audio file from the specified path.
   * @param src Path to the audio file (e.g., 'assets/music.mp3')
   */
  loadAudio(src: string): void {
    if (this.audio && this.audio.src !== src) {
      this.audio.src = src;
      this.audio.load();
      console.log(`Audio loaded: ${src}`);
    } else if (!this.audio) {
      console.warn('Audio object not available. Cannot load audio.');
    }
  }

  /**
   * Play the sound.
   * @returns Promise<void> that resolves when the sound starts playing.
   */
  async play(): Promise<void> {
    if (this.audio) { // Check if audio object exists
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
        console.log('Audio playback started.');
      } catch (error) {
        console.error('Error attempting to play audio:', error);
      }
    } else {
      console.warn('Audio object not available. Cannot play audio.');
    }
  }

  /**
   * Pause the sound.
   */
  pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      console.log('Audio playback paused.');
    }
  }

  /**
   * Stop the sound and reset it to the beginning.
   */
  stop(): void {
    if (this.audio && (this.audio.paused === false || this.audio.ended === false)) {
      this.audio.pause();
      this.audio.currentTime = 0;
      console.log('Audio playback stopped and reset.');
    }
  }

  /**
   * Set the volume of the sound.
   * @param volume The volume (between 0 and 1).
   */
  setVolume(volume: number): void {
    if (this.audio && volume >= 0 && volume <= 1) {
      this.audio.volume = volume;
      console.log(`Audio volume set to: ${volume}`);
    } else if (!this.audio) {
      console.warn('Audio object not available. Cannot set volume.');
    } else {
      console.warn('Volume must be between 0 and 1.');
    }
  }

  /**
   * Get the current volume.
   * @returns The current volume (0 to 1), or 0 if audio object is not available.
   */
  getVolume(): number {
    return this.audio ? this.audio.volume : 0;
  }
}