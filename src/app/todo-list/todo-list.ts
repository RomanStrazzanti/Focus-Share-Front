// src/app/todo-list/todo-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Import du service Supabase
import { SupabaseService } from '../services/supabase.services'; // Assurez-vous que le chemin est correct

// Définition des interfaces directement dans le fichier du composant
export interface Subtask {
  id: string; // Pour identifier la sous-tâche
  description: string;
  completed: boolean;
}

export interface Task {
  id: string; // ID unique de la tâche (sera généré par Supabase)
  title: string;
  notes?: string; // Optionnel
  dueDate?: Date; // Optionnel
  completed: boolean;
  subtasks: Subtask[]; // Le tableau de sous-tâches stocké en JSONB
  createdAt: Date; // Date de création de la tâche
}

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './todo-list.html',
  styleUrls: ['./todo-list.css']
})
export class TodoListComponent implements OnInit {

  // --- SUPPRIMÉ : Configuration Supabase directe n'est plus ici ---
  // Le service Supabase gère maintenant l'initialisation du client.

  // Propriété pour les nouvelles tâches à ajouter
  newTask: Task = {
    id: '',
    title: '',
    notes: '',
    dueDate: undefined,
    completed: false,
    subtasks: [],
    createdAt: new Date()
  };

  // Tableau pour stocker toutes les tâches
  tasks: Task[] = [];
  loadingTasks: boolean = false; // Pour gérer l'état de chargement

  // Injection du SupabaseService dans le constructeur
  constructor(private supabaseService: SupabaseService) {
    // Le client Supabase est maintenant accessible via this.supabaseService.client
  }

  ngOnInit(): void {
    // Charge les tâches depuis Supabase au démarrage du composant
    this.loadTasksFromSupabase();
  }

  // --- Méthodes de gestion des sous-tâches dans le formulaire de nouvelle tâche ---
  addNewSubtask(): void {
    this.newTask.subtasks.push({ id: this.generateUniqueId(), description: '', completed: false });
  }

  removeNewSubtask(index: number): void {
    this.newTask.subtasks.splice(index, 1);
  }

  // --- Méthodes d'interaction avec Supabase ---

  // Charge les tâches depuis la base de données Supabase
  async loadTasksFromSupabase(): Promise<void> {
    this.loadingTasks = true;
    try {
      const { data, error } = await this.supabaseService.client // Utilise le service
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false }); // Ordonne par date de création, plus récent en premier

      if (error) {
        console.error('Erreur lors du chargement des tâches:', error);
        // Gérer l'erreur (ex: afficher un message à l'utilisateur)
      } else {
        // Mappe les données brutes de Supabase vers l'interface Task
        this.tasks = data.map(item => ({
          id: item.id,
          title: item.title,
          notes: item.notes,
          dueDate: item.due_date ? new Date(item.due_date) : undefined, // Convertit la chaîne de date en objet Date
          completed: item.completed,
          subtasks: item.subtasks as Subtask[], // Supabase renvoie jsonb comme un tableau d'objets JS
          createdAt: new Date(item.created_at) // Convertit la chaîne de date en objet Date
        }));
        console.log('Tâches chargées depuis Supabase:', this.tasks);
      }
    } catch (e) {
      console.error('Exception lors du chargement des tâches:', e);
    } finally {
      this.loadingTasks = false;
    }
  }

  // Ajoute une nouvelle tâche à Supabase
  async addTask(): Promise<void> {
    if (this.newTask.title.trim()) {
      const taskToInsert: Omit<Task, 'id' | 'createdAt'> = { // Omit id and createdAt as Supabase handles them
        title: this.newTask.title.trim(),
        notes: this.newTask.notes?.trim() || undefined,
        dueDate: this.newTask.dueDate,
        completed: false,
        subtasks: this.newTask.subtasks.filter((st: Subtask) => st.description.trim() !== '')
                                        .map((st: Subtask) => ({ ...st, id: this.generateUniqueId() }))
      };

      try {
        const { data, error } = await this.supabaseService.client // Utilise le service
          .from('tasks')
          .insert([taskToInsert])
          .select(); // Retourne les données insérées, y compris l'ID généré et createdAt

        if (error) {
          console.error('Erreur lors de l\'ajout de la tâche:', error);
          // Gérer l'erreur
        } else if (data && data.length > 0) {
          const addedTask = data[0];
          // Mappe la tâche ajoutée pour qu'elle corresponde à l'interface Task locale
          const mappedTask: Task = {
            id: addedTask.id,
            title: addedTask.title,
            notes: addedTask.notes,
            dueDate: addedTask.due_date ? new Date(addedTask.due_date) : undefined,
            completed: addedTask.completed,
            subtasks: addedTask.subtasks as Subtask[],
            createdAt: new Date(addedTask.created_at)
          };
          this.tasks.unshift(mappedTask); // Ajoute la nouvelle tâche en haut de la liste
          console.log('Tâche ajoutée à Supabase:', mappedTask);
          this.resetNewTaskForm();
        }
      } catch (e) {
        console.error('Exception lors de l\'ajout de la tâche:', e);
      }
    } else {
      console.warn('Le titre de la tâche ne peut pas être vide.');
    }
  }

  // Met à jour l'état de complétion d'une tâche dans Supabase
  async toggleTaskCompletion(task: Task): Promise<void> {
    // Met à jour l'état local avant la requête pour une meilleure réactivité UI
    task.completed = !task.completed;
    if (task.completed) {
      task.subtasks.forEach((subtask: Subtask) => subtask.completed = true);
    } else {
      // Si la tâche est décomplétée, toutes les sous-tâches le sont aussi
      task.subtasks.forEach((subtask: Subtask) => subtask.completed = false);
    }

    try {
      const { error } = await this.supabaseService.client // Utilise le service
        .from('tasks')
        .update({ completed: task.completed, subtasks: task.subtasks }) // Met à jour aussi les sous-tâches
        .eq('id', task.id);

      if (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
        // Revenir à l'état précédent si erreur
        task.completed = !task.completed;
        // Recharger les sous-tâches si nécessaire
        this.loadTasksFromSupabase(); // Recharger pour synchroniser en cas d'erreur
      } else {
        console.log('Tâche mise à jour dans Supabase:', task);
      }
    } catch (e) {
      console.error('Exception lors de la mise à jour de la tâche:', e);
    }
  }

  // Met à jour l'état de complétion d'une sous-tâche dans Supabase
  async toggleSubtaskCompletion(task: Task, subtask: Subtask): Promise<void> {
    subtask.completed = !subtask.completed;

    // Vérifie si toutes les sous-tâches sont complétées pour mettre à jour la tâche principale
    if (task.subtasks.every((st: Subtask) => st.completed)) {
      task.completed = true;
    } else {
      task.completed = false;
    }

    try {
      const { error } = await this.supabaseService.client // Utilise le service
        .from('tasks')
        .update({ completed: task.completed, subtasks: task.subtasks }) // Met à jour la tâche principale et son tableau de sous-tâches
        .eq('id', task.id);

      if (error) {
        console.error('Erreur lors de la mise à jour de la sous-tâche:', error);
        // Revenir à l'état précédent si erreur
        subtask.completed = !subtask.completed;
        task.completed = !task.completed; // Revenir aussi pour la tâche principale
        this.loadTasksFromSupabase(); // Recharger pour synchroniser en cas d'erreur
      } else {
        console.log('Sous-tâche mise à jour dans Supabase:', subtask);
      }
    } catch (e) {
      console.error('Exception lors de la mise à jour de la sous-tâche:', e);
    }
  }

  // Supprime une tâche de Supabase
  async deleteTask(id: string): Promise<void> {
    // Remplacé confirm par console.log pour respecter les consignes de l'environnement Canvas
    console.log('Demande de suppression de tâche avec ID:', id);
    // Dans une vraie application, vous implémenteriez un modal de confirmation personnalisé ici.
    // Pour l'instant, nous allons procéder à la suppression directe pour le test.
    try {
      const { error } = await this.supabaseService.client // Utilise le service
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression de la tâche:', error);
        // Gérer l'erreur
      } else {
        this.tasks = this.tasks.filter((task: Task) => task.id !== id);
        console.log('Tâche supprimée de Supabase avec ID:', id);
      }
    } catch (e) {
      console.error('Exception lors de la suppression de la tâche:', e);
    }
  }

  // Méthode pour éditer une tâche (à développer si un formulaire d'édition est créé)
  editTask(task: Task): void {
    console.log('Fonctionnalité d\'édition à implémenter pour la tâche:', task.title);
    // Pour une implémentation complète, vous ouvririez un modal ou navigueriez vers un formulaire d'édition.
    // Pour l'instant, nous nous concentrons sur la persistance.
  }

  // --- Fonctions utilitaires ---

  // Réinitialise le formulaire de nouvelle tâche
  resetNewTaskForm(): void {
    this.newTask = {
      id: '',
      title: '',
      notes: '',
      dueDate: undefined,
      completed: false,
      subtasks: [],
      createdAt: new Date()
    };
  }

  // Génère un ID unique simple (pour les sous-tâches côté client)
  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
