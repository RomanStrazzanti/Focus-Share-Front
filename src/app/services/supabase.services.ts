// src/app/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  private readonly SUPABASE_URL: string = 'https://ufrvlyqirwtlqudptdhd.supabase.co';
  private readonly SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmcnZseXFpcnd0bHF1ZHB0ZGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NzMxOTAsImV4cCI6MjA2NzQ0OTE5MH0._2Cg5w3gJaypKpJOCK-B7WvdZvm6VCBlkq6M7MaAV_Y';

  constructor() {
    this.supabase = createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
  }

  // --- Méthodes d'authentification ---
  // RENOMMEZ signInWithPassword() EN signIn() pour correspondre à votre LoginComponent
  signIn(email: string, password: string) { // <-- CORRECTION : Renommé en 'signIn'
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  // Gardez signUp si vous l'utilisez ailleurs
  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  getSession() {
    return this.supabase.auth.getSession();
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  onAuthStateChange(callback: (event: string, session: any | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
