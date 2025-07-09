// src/app/tasks/tasks.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

// Définition des interfaces adaptées à votre API locale
export interface Subtask {
  title: string; // Description de la sous-tâche
  done: boolean; // État de complétion de la sous-tâche
}

export interface Task {
  id: string;
  user_id: string; // Ajout de l'ID utilisateur
  title: string;
  notes?: string;
  due_date?: string; // Date d'échéance en format string
  completed: boolean;
  subtasks: Subtask[]; // Tableau de sous-tâches
  created_at: string; // Date de création en format string
  isUpdating: boolean; // isUpdating est maintenant un booléen obligatoire
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.css']
})
export class TasksComponent implements OnInit, OnDestroy {

  tasks: Task[] = [];
  newTask: Partial<Task> = {
    title: '',
    notes: '',
    due_date: '',
    subtasks: [],
    completed: false,
  };

  loading = false;
  currentUserId: string | null = null;
  showCompletedTasks: boolean = false; // Propriété pour contrôler l'affichage des tâches terminées
  showNewTaskForm: boolean = false; // Propriété pour contrôler l'affichage du formulaire de nouvelle tâche
  errorMessage: string | null = null; // Pour afficher les messages d'erreur

  private apiUrl = 'http://localhost:3000/api/tasks';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.currentUserId = decodedToken.sub || decodedToken.userId;
        console.log('User ID extrait du token:', this.currentUserId);
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
        this.currentUserId = null;
      }
    } else {
      console.warn('Aucun token d\'accès trouvé dans localStorage.');
      this.currentUserId = null;
    }

    if (this.currentUserId) {
      this.loadTasks();
    } else {
      console.warn('Aucun ID utilisateur valide. Impossible de charger les tâches.');
      this.tasks = [];
    }
  }

  ngOnDestroy(): void {
    // Aucune souscription RxJS à désouscrire ici
  }

  getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    if (token) {
      return {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      };
    }
    console.warn('Aucun token d\'accès trouvé. Les requêtes API pourraient échouer.');
    return {};
  }

  /**
   * Fonction de tri pour les tâches :
   * 1. Non complétées avant complétées.
   * 2. Si même état de complétion :
   * a. Tâches avec date d'échéance avant celles sans.
   * b. Si deux dates d'échéance : tri par date d'échéance ascendante (plus proche d'abord).
   * c. Si pas de date d'échéance : tri par date de création descendante (plus récente d'abord).
   */
  private sortTasks(): void {
    this.tasks.sort((a, b) => {
      // 1. Tri par état de complétion (non complétées d'abord)
      if (a.completed && !b.completed) {
        return 1;
      }
      if (!a.completed && b.completed) {
        return -1;
      }

      // Si le même état de complétion, on passe au tri secondaire
      // Gérer les dates d'échéance (due_date)
      const aHasDueDate = !!a.due_date;
      const bHasDueDate = !!b.due_date;

      // 2a. Tâches avec date d'échéance avant celles sans
      if (aHasDueDate && !bHasDueDate) {
        return -1; // a vient avant b
      }
      if (!aHasDueDate && bHasDueDate) {
        return 1; // b vient avant a
      }

      // 2b. Si les deux ont une date d'échéance, tri par date d'échéance ascendante
      if (aHasDueDate && bHasDueDate) {
        const dateA = new Date(a.due_date!);
        const dateB = new Date(b.due_date!);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
      }

      // 2c. Si les deux n'ont pas de date d'échéance ou si les dates d'échéance sont identiques,
      // tri par date de création descendante (plus récente en premier)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  // --- PROPRIÉTÉS ACCESSEURS (GETTERS) ---
  get noTasksAvailable(): boolean {
    return !this.loading && this.tasks.length === 0;
  }

  get allUncompletedTasksDoneAndHidden(): boolean {
    return !this.loading && this.tasks.filter(t => !t.completed).length === 0 && this.tasks.filter(t => t.completed).length > 0 && !this.showCompletedTasks;
  }

  get hasCompletedTasks(): boolean {
    return this.tasks.filter(t => t.completed).length > 0;
  }

  get completedTasksCount(): number {
    return this.tasks.filter(t => t.completed).length;
  }
  // --- FIN DES PROPRIÉTÉS ACCESSEURS ---

  // --- NOUVELLE FONCTION TRACKBY ---
  trackByFn(index: number, item: any): any {
    return item.id;
  }
  // --- FIN NOUVELLE FONCTION TRACKBY ---

  loadTasks() {
    if (!this.currentUserId) {
      this.tasks = [];
      return;
    }

    this.loading = true;
    this.http.get<Task[]>(this.apiUrl, this.getAuthHeaders()).subscribe({
      next: (data) => {
        // Initialise isUpdating à false pour toutes les tâches chargées
        this.tasks = data.filter(task => task.user_id === this.currentUserId).map(task => ({ ...task, isUpdating: false }));
        this.sortTasks(); // Applique le tri après le chargement
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Tâches chargées et filtrées:', this.tasks);
      },
      error: (err) => {
        console.error('Erreur chargement des tâches:', err);
        this.errorMessage = 'Erreur lors du chargement des tâches. Veuillez réessayer.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createTask() {
    if (!this.newTask.title?.trim() || !this.currentUserId) {
      console.warn('Titre de tâche vide ou utilisateur non connecté.');
      this.errorMessage = 'Le titre de la tâche ne peut pas être vide.';
      return;
    }

    this.errorMessage = null; // Réinitialise le message d'erreur
    const tempId = 'temp-' + this.generateUniqueId();
    const now = new Date().toISOString();
    const optimisticTask: Task = {
      id: tempId,
      user_id: this.currentUserId,
      title: this.newTask.title.trim(),
      notes: this.newTask.notes?.trim() || undefined,
      due_date: this.newTask.due_date || undefined,
      completed: false,
      subtasks: this.newTask.subtasks?.filter(st => st.title.trim() !== '') || [],
      created_at: now,
      isUpdating: false, // Initialisé à false
    };

    this.tasks.unshift(optimisticTask);
    this.sortTasks(); // Applique le tri après l'ajout optimiste
    const originalNewTask = { ...this.newTask };
    this.resetNewTaskForm();
    this.cdr.detectChanges();

    this.http.post<Task>(this.apiUrl, optimisticTask, this.getAuthHeaders()).subscribe({
      next: (taskFromServer) => {
        const index = this.tasks.findIndex(t => t.id === tempId);
        if (index !== -1) {
          // S'assurer que isUpdating est conservé ou réinitialisé correctement
          this.tasks[index] = { ...taskFromServer, isUpdating: false };
        }
        this.sortTasks(); // Applique le tri après la synchronisation
        this.cdr.detectChanges();
        this.showNewTaskForm = false; // Masque le formulaire après création réussie
        console.log('Tâche créée et synchronisée:', taskFromServer);
      },
      error: (err) => {
        this.tasks = this.tasks.filter(t => t.id !== tempId);
        this.newTask = originalNewTask;
        this.errorMessage = 'Erreur lors de la création de la tâche. Veuillez réessayer.';
        this.cdr.detectChanges();
        console.error('Erreur création tâche, annulation optimiste:', err);
      }
    });
  }

  async toggleTaskCompletion(task: Task): Promise<void> {
    // NOUVEAU: Empêche la double exécution si une mise à jour est déjà en cours
    if (task.isUpdating) {
      console.warn(`[toggleTaskCompletion] Tâche ${task.id} est déjà en cours de mise à jour. Ignoré.`);
      return;
    }

    if (!this.currentUserId || task.user_id !== this.currentUserId) {
      console.warn('Non autorisé à modifier cette tâche.');
      this.errorMessage = 'Vous n\'êtes pas autorisé à modifier cette tâche.';
      return;
    }

    this.errorMessage = null; // Réinitialise le message d'erreur
    task.isUpdating = true; // Marque la tâche comme étant en cours de mise à jour
    console.log(`[toggleTaskCompletion] Début pour la tâche: ${task.title}, ID: ${task.id}`);
    console.log(`[toggleTaskCompletion] État initial 'completed': ${task.completed}`);

    const originalCompleted = task.completed;
    const originalSubtasks = JSON.parse(JSON.stringify(task.subtasks)); // Copie profonde

    // Mettre à jour l'état de la tâche et des sous-tâches (optimiste)
    task.completed = !task.completed;
    if (task.completed) {
      task.subtasks.forEach((subtask: Subtask) => subtask.done = true);
    } else {
      task.subtasks.forEach((subtask: Subtask) => subtask.done = false);
    }

    console.log(`[toggleTaskCompletion] État optimiste 'completed': ${task.completed}`);
    this.sortTasks(); // Applique le tri après la modification optimiste
    this.cdr.detectChanges(); // Met à jour l'UI immédiatement

    try {
      console.log(`[toggleTaskCompletion] Envoi de la requête PUT pour la tâche: ${task.id}`);
      await this.http.put<Task>(
        `${this.apiUrl}/${task.id}`,
        { completed: task.completed, subtasks: task.subtasks },
        this.getAuthHeaders()
      ).toPromise();

      console.log(`[toggleTaskCompletion] Requête PUT réussie pour la tâche: ${task.id}. Nouvel état: ${task.completed}`);
    } catch (e) {
      console.error(`[toggleTaskCompletion] Erreur lors de la mise à jour de la tâche ${task.id}, annulation optimiste:`, e);
      // Annulation des modifications optimistes
      task.completed = originalCompleted;
      task.subtasks = originalSubtasks;
      this.sortTasks(); // Re-tri en cas d'erreur
      this.errorMessage = 'Erreur lors de la mise à jour de la tâche. Veuillez vérifier votre connexion ou réessayer.';
      this.cdr.detectChanges(); // Met à jour l'UI pour refléter l'annulation
      console.log(`[toggleTaskCompletion] État annulé pour la tâche ${task.id}. Revert à 'completed': ${task.completed}`);
    } finally {
      task.isUpdating = false; // Termine la mise à jour, que ce soit un succès ou un échec
      this.cdr.detectChanges();
    }
  }

  async toggleSubtaskCompletion(task: Task, subtask: Subtask): Promise<void> {
    // NOUVEAU: Empêche la double exécution si la tâche parente est déjà en cours de mise à jour
    if (task.isUpdating) {
      console.warn(`[toggleSubtaskCompletion] Tâche parente ${task.id} est déjà en cours de mise à jour. Ignoré.`);
      return;
    }

    if (!this.currentUserId || task.user_id !== this.currentUserId) {
      console.warn('Non autorisé à modifier cette sous-tâche.');
      this.errorMessage = 'Vous n\'êtes pas autorisé à modifier cette sous-tâche.';
      return;
    }

    this.errorMessage = null; // Réinitialise le message d'erreur
    task.isUpdating = true; // Marque la tâche parente comme étant en cours de mise à jour
    console.log(`[toggleSubtaskCompletion] Début pour sous-tâche: ${subtask.title} de la tâche: ${task.title}`);
    console.log(`[toggleSubtaskCompletion] État initial sous-tâche 'done': ${subtask.done}, tâche 'completed': ${task.completed}`);

    const originalSubtaskDone = subtask.done;
    const originalTaskCompleted = task.completed;

    subtask.done = !subtask.done;

    // Si toutes les sous-tâches sont terminées, marquer la tâche principale comme terminée
    if (task.subtasks.every((st: Subtask) => st.done)) {
      task.completed = true;
    } else {
      task.completed = false;
    }

    console.log(`[toggleSubtaskCompletion] État optimiste sous-tâche 'done': ${subtask.done}, tâche 'completed': ${task.completed}`);
    this.sortTasks(); // Applique le tri après la modification optimiste
    this.cdr.detectChanges(); // Met à jour l'UI immédiatement

    try {
      console.log(`[toggleSubtaskCompletion] Envoi de la requête PUT pour la tâche (via sous-tâche): ${task.id}`);
      await this.http.put<Task>(
        `${this.apiUrl}/${task.id}`,
        { completed: task.completed, subtasks: task.subtasks },
        this.getAuthHeaders()
      ).toPromise();

      console.log(`[toggleSubtaskCompletion] Requête PUT réussie pour la tâche (via sous-tâche): ${task.id}`);
    } catch (e) {
      console.error(`[toggleSubtaskCompletion] Erreur lors de la mise à jour de la sous-tâche ${subtask.title}, annulation optimiste:`, e);
      // Annulation des modifications optimistes
      subtask.done = originalSubtaskDone;
      task.completed = originalTaskCompleted;
      this.sortTasks(); // Re-tri en cas d'erreur
      this.errorMessage = 'Erreur lors de la mise à jour de la sous-tâche. Veuillez vérifier votre connexion ou réessayer.';
      this.cdr.detectChanges(); // Met à jour l'UI pour refléter l'annulation
      console.log(`[toggleSubtaskCompletion] État annulé pour sous-tâche ${subtask.title}. Revert à 'done': ${subtask.done}`);
    } finally {
      task.isUpdating = false; // Termine la mise à jour
      this.cdr.detectChanges();
    }
  }

  deleteTask(id: string) {
    const taskToDelete = this.tasks.find(t => t.id === id);
    if (!this.currentUserId || !taskToDelete || taskToDelete.user_id !== this.currentUserId) {
      console.warn('Non autorisé à supprimer cette tâche.');
      this.errorMessage = 'Vous n\'êtes pas autorisé à supprimer cette tâche.';
      return;
    }

    this.errorMessage = null; // Réinitialise le message d'erreur
    console.log('Demande de suppression de tâche avec ID:', id);

    const originalTasks = [...this.tasks]; // Copie pour le rollback
    this.tasks = this.tasks.filter(t => t.id !== id); // Suppression optimiste
    this.cdr.detectChanges(); // Met à jour l'UI immédiatement

    this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders()).subscribe({
      next: () => {
        console.log('Tâche supprimée (optimiste):', id);
      },
      error: (err) => {
        console.error('Erreur suppression tâche, annulation optimiste:', err);
        this.tasks = originalTasks; // Rollback
        this.errorMessage = 'Erreur lors de la suppression de la tâche. Veuillez réessayer.';
        this.cdr.detectChanges(); // Met à jour l'UI pour refléter l'annulation
      }
    });
  }

  editTask(task: Task): void {
    if (!this.currentUserId || task.user_id !== this.currentUserId) {
      console.warn('Non autorisé à éditer cette tâche.');
      this.errorMessage = 'Vous n\'êtes pas autorisé à éditer cette tâche.';
      return;
    }
    console.log('Fonctionnalité d\'édition à implémenter pour la tâche:', task.title);
    this.errorMessage = null; // Réinitialise le message d'erreur si l'édition n'est pas encore implémentée
  }

  addNewSubtask(): void {
    this.newTask.subtasks = this.newTask.subtasks || [];
    this.newTask.subtasks.push({ title: '', done: false });
    this.cdr.detectChanges();
  }

  removeNewSubtask(index: number): void {
    this.newTask.subtasks?.splice(index, 1);
    this.cdr.detectChanges();
  }

  resetNewTaskForm(): void {
    this.newTask = {
      title: '',
      notes: '',
      due_date: '',
      subtasks: [],
      completed: false,
    };
    this.cdr.detectChanges();
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
