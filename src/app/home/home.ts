// src/app/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode'; // Pour décoder le token JWT et obtenir l'ID utilisateur

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule], // CommonModule pour ngIf, ngFor, etc.
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  userName: string = 'Cher utilisateur'; // Nom de l'utilisateur, par défaut
  dailyMotivation: string = ''; // Phrase de motivation quotidienne

  // Liste des phrases de motivation
  private motivationPhrases: string[] = [
    "Chaque jour est une nouvelle opportunité de grandir.",
    "La persévérance est la clé du succès.",
    "Croyez en vous et tout deviendra possible.",
    "Le chemin vers le succès est toujours en construction.",
    "Faites de chaque jour un chef-d'œuvre.",
    "Votre potentiel est illimité.",
    "Commencez là où vous êtes. Utilisez ce que vous avez. Faites ce que vous pouvez.",
    "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
    "La seule façon de faire du bon travail est d'aimer ce que vous faites.",
    "Les défis sont ce qui rend la vie intéressante ; les surmonter est ce qui rend la vie significative."
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadUserName();
    this.setDailyMotivation();
  }

  ngOnDestroy(): void {
    // Aucune ressource à nettoyer ici pour l'instant
  }

  /**
   * Charge le nom de l'utilisateur à partir du token JWT.
   * Si un prénom n'est pas disponible, un nom générique est utilisé.
   */
  private loadUserName(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        // Supposons que le prénom est dans 'name' ou 'given_name' ou peut être extrait de 'sub'
        // Si votre token ne contient pas ces champs, vous devrez ajuster ou charger le profil utilisateur.
        this.userName = decodedToken.name || decodedToken.given_name || (decodedToken.sub ? `Utilisateur ${decodedToken.sub.substring(0, 8)}` : 'Cher utilisateur');
      } catch (error) {
        console.error('Erreur lors du décodage du token JWT pour le nom d\'utilisateur:', error);
        this.userName = 'Cher utilisateur';
      }
    } else {
      this.userName = 'Cher utilisateur';
    }
  }

  /**
   * Sélectionne une phrase de motivation basée sur le jour de l'année.
   */
  private setDailyMotivation(): void {
    const now = new Date();
    // Calculer le jour de l'année (approximatif, pour une rotation simple)
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Utiliser le modulo pour faire tourner les phrases
    const index = dayOfYear % this.motivationPhrases.length;
    this.dailyMotivation = this.motivationPhrases[index];
  }

  /**
   * Navigue vers la page du minuteur.
   */
  goToTimer(): void {
    this.router.navigate(['/timer']);
  }

  /**
   * Navigue vers la page du forum.
   */
  goToForum(): void {
    this.router.navigate(['/forum']);
  }
}
