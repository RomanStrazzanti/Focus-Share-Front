import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Task {
  id: string;
  title: string;
  notes?: string;
  due_date?: string;
  completed: boolean;
  subtasks: { title: string; done: boolean }[];
  created_at: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.css'],
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  newTask: Partial<Task> = {
    title: '',
    notes: '',
    due_date: '',
    subtasks: [],
  };

  loading = false;

  private apiUrl = 'http://localhost:3000/api/tasks';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTasks();
  }

  getAuthHeaders() {
    const token = localStorage.getItem('access_token') || '';
    return {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    };
  }

  loadTasks() {
    this.loading = true;
    this.http.get<Task[]>(this.apiUrl, this.getAuthHeaders()).subscribe({
      next: (data) => {
        this.tasks = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement des tâches', err);
        this.loading = false;
      }
    });
  }

  createTask() {
    if (!this.newTask.title?.trim()) return;

    this.http.post<Task>(this.apiUrl, this.newTask, this.getAuthHeaders()).subscribe({
      next: (task) => {
        this.tasks.push(task);
        this.newTask = { title: '', notes: '', due_date: '', subtasks: [] };
      },
      error: (err) => {
        console.error('Erreur création tâche', err);
      }
    });
  }

  deleteTask(id: string) {
    this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders()).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== id);
      },
      error: (err) => {
        console.error('Erreur suppression tâche', err);
      }
    });
  }
}
