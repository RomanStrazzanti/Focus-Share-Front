import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase.services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.html',
  styleUrls: ['./create-user.css']
})
export class CreateUserComponent {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  message: string = '';

  constructor(private supabase: SupabaseService, private router: Router) {}

  async createUser() {
    if (this.password !== this.confirmPassword) {
      this.message = '❌ Les mots de passe ne correspondent pas.';
      return;
    }

    const { data, error } = await this.supabase.signUp(this.email, this.password);

    if (error) {
      this.message = '❌ Erreur : ' + error.message;
      return;
    }

    this.message = '✅ Utilisateur créé avec succès !';
    // Tu peux aussi rediriger vers /login :
    // this.router.navigate(['/login']);
  }
}
