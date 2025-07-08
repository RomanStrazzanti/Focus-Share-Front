import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // ✅ Ajouté ici
import { CommonModule } from '@angular/common'; // ✅ recommandé
import { SupabaseService } from '../services/supabase.services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true, // ✅ important si ce n'est pas déjà là
  imports: [CommonModule, FormsModule], // ✅ Ajoute FormsModule ici
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  token: string = '';

  constructor(private supabase: SupabaseService, private router: Router) {}

  async login() {
    const { data, error } = await this.supabase.signIn(this.email, this.password);

    if (error) {
      alert('Erreur : ' + error.message);
      return;
    }

    this.token = data.session?.access_token || '';
    localStorage.setItem('access_token', this.token);
    this.router.navigate(['/messages']);
    
    console.log('✅ Access Token :', this.token);
    alert('Connexion réussie ! Le token est dans la console.');
  }
}
