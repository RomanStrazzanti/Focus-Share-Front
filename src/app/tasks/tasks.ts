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

  private apiUrl = 'http://localhost:3000/api/tasks';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  trackByFn(index: number, item: any): any {
    return item.id;
  }

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

  // Fonction de tri pour les tâches : non complétées d'abord, puis complétées.
  // Dans chaque groupe, tri par date de création (plus récent en premier).
  private sortTasks(): void {
    this.tasks.sort((a, b) => {
      // Les tâches non complétées viennent avant les complétées
      if (a.completed && !b.completed) {
        return 1;
      }
      if (!a.completed && b.completed) {
        return -1;
      }
      // Si les deux ont le même état de complétion, tri par created_at (plus récent en premier)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  // --- NOUVELLES PROPRIÉTÉS ACCESSEURS (GETTERS) ---
  get noTasksAvailable(): boolean {
    return !this.loading && this.tasks.length === 0;
  }

  get allUncompletedTasksDoneAndHidden(): boolean {
    // Cette condition est pour le message "Toutes les tâches sont terminées..."
    return !this.loading && this.tasks.filter(t => !t.completed).length === 0 && this.tasks.filter(t => t.completed).length > 0 && !this.showCompletedTasks;
  }

  get hasCompletedTasks(): boolean {
    return this.tasks.filter(t => t.completed).length > 0;
  }

  get completedTasksCount(): number {
    return this.tasks.filter(t => t.completed).length;
  }
  // --- FIN DES NOUVELLES PROPRIÉTÉS ACCESSEURS ---


  loadTasks() {
    if (!this.currentUserId) {
      this.tasks = [];
      return;
    }

    this.loading = true;
    this.http.get<Task[]>(this.apiUrl, this.getAuthHeaders()).subscribe({
      next: (data) => {
        this.tasks = data.filter(task => task.user_id === this.currentUserId);
        this.sortTasks(); // Applique le tri après le chargement
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Tâches chargées et filtrées:', this.tasks);
      },
      error: (err) => {
        console.error('Erreur chargement des tâches:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createTask() {
    if (!this.newTask.title?.trim() || !this.currentUserId) {
      console.warn('Titre de tâche vide ou utilisateur non connecté.');
      return;
    }

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
    };

    this.tasks.unshift(optimisticTask);
    this.sortTasks();
    const originalNewTask = { ...this.newTask };
    this.resetNewTaskForm();
    this.cdr.detectChanges();

    this.http.post<Task>(this.apiUrl, optimisticTask, this.getAuthHeaders()).subscribe({
      next: (taskFromServer) => {
        const index = this.tasks.findIndex(t => t.id === tempId);
        if (index !== -1) {
          this.tasks[index] = taskFromServer;
        }
        this.sortTasks();
        this.cdr.detectChanges();
        console.log('Tâche créée et synchronisée:', taskFromServer);
      },
      error: (err) => {
        this.tasks = this.tasks.filter(t => t.id !== tempId);
        this.newTask = originalNewTask;
        this.cdr.detectChanges();
        console.error('Erreur création tâche, annulation optimiste:', err);
      }
    });
  }

  async toggleTaskCompletion(task: Task): Promise<void> {
    if (!this.currentUserId || task.user_id !== this.currentUserId) {
      console.warn('Non autorisé à modifier cette tâche.');
      return;
    }

    const originalCompleted = task.completed;
    const originalSubtasks = JSON.parse(JSON.stringify(task.subtasks));

    if (task.completed) {
      task.subtasks.forEach((subtask: Subtask) => subtask.done = true);
    } else {
      task.subtasks.forEach((subtask: Subtask) => subtask.done = false);
    }

    this.sortTasks();
    this.cdr.detectChanges();

    try {
      await this.http.put<Task>(
        `${this.apiUrl}/${task.id}`,
        { completed: task.completed, subtasks: task.subtasks },
        this.getAuthHeaders()
      ).toPromise();

      console.log('Tâche mise à jour (optimiste):', task);
    } catch (e) {
      console.error('Exception lors de la mise à jour de la tâche, annulation optimiste:', e);
      task.completed = originalCompleted;
      task.subtasks = originalSubtasks;
      this.sortTasks();
      this.cdr.detectChanges();
    }
  }

  async toggleSubtaskCompletion(task: Task, subtask: Subtask): Promise<void> {
    if (!this.currentUserId || task.user_id !== this.currentUserId) {
      console.warn('Non autorisé à modifier cette sous-tâche.');
      return;
    }

    const originalSubtaskDone = subtask.done;
    const originalTaskCompleted = task.completed;

    subtask.done = !subtask.done;

    if (task.subtasks.every((st: Subtask) => st.done)) {
      task.completed = true;
    } else {
      task.completed = false;
    }

    this.sortTasks();
    this.cdr.detectChanges();

    try {
      await this.http.put<Task>(
        `${this.apiUrl}/${task.id}`,
        { completed: task.completed, subtasks: task.subtasks },
        this.getAuthHeaders()
      ).toPromise();

      console.log('Sous-tâche mise à jour (optimiste):', subtask);
    } catch (e) {
      console.error('Exception lors de la mise à jour de la sous-tâche, annulation optimiste:', e);
      subtask.done = originalSubtaskDone;
      task.completed = originalTaskCompleted;
      this.sortTasks();
      this.cdr.detectChanges();
    }
  }

  deleteTask(id: string) {
    const taskToDelete = this.tasks.find(t => t.id === id);
    if (!this.currentUserId || !taskToDelete || taskToDelete.user_id !== this.currentUserId) {
      console.warn('Non autorisé à supprimer cette tâche.');
      return;
    }

    console.log('Demande de suppression de tâche avec ID:', id);

    const originalTasks = [...this.tasks];
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.cdr.detectChanges();

    this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders()).subscribe({
      next: () => {
        console.log('Tâche supprimée (optimiste):', id);
      },
      error: (err) => {
        console.error('Erreur suppression tâche, annulation optimiste:', err);
        this.tasks = originalTasks;
        this.cdr.detectChanges();
      }
    });
  }

  editTask(task: Task): void {
    if (!this.currentUserId || task.user_id !== this.currentUserId) {
      console.warn('Non autorisé à éditer cette tâche.');
      return;
    }
    console.log('Fonctionnalité d\'édition à implémenter pour la tâche:', task.title);
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
