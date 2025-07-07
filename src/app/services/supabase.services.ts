import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ufrvlyqirwtlqudptdhd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmcnZseXFpcnd0bHF1ZHB0ZGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NzMxOTAsImV4cCI6MjA2NzQ0OTE5MH0._2Cg5w3gJaypKpJOCK-B7WvdZvm6VCBlkq6M7MaAV_Y';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  getSession() {
    return this.supabase.auth.getSession();
  }

  signOut() {
    return this.supabase.auth.signOut();
  }
}
