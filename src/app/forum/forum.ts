import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Post {
  id: number;
  author_id: string;
  content: string;
  parent_post_id: number | null;
  created_at: string;
  replies?: Post[];
}

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './forum.html',
  styleUrls: ['./forum.css']
})
export class ForumComponent implements OnInit {
  posts: Post[] = [];
  newPostContent = '';
  replyContent = '';
  replyToPostId: number | null = null;

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };
 
    console.log('Token2:', token);
    this.http.get<Post[]>('http://localhost:3000/api/forum-posts', { headers }).subscribe({
      next: (data) => {
        this.posts = data;
        this.cd.detectChanges(); // 👈 force Angular à mettre à jour la vue
      },
      error: (err) => console.error('Erreur chargement posts', err)
    });
  }

  createPost() {
    if (!this.newPostContent.trim()) return;

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.post<Post>('http://localhost:3000/api/forum-posts', { content: this.newPostContent }, { headers }).subscribe({
      next: () => {
        this.newPostContent = '';
        this.loadPosts();
      },
      error: (err) => console.error('Erreur création post', err)
    });
  }

  startReply(postId: number) {
    this.replyToPostId = postId;
    this.replyContent = '';
  }

  createReply() {
    if (!this.replyContent.trim() || !this.replyToPostId) return;

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.post<Post>('http://localhost:3000/api/forum-posts', {
      content: this.replyContent,
      parent_post_id: this.replyToPostId
    }, { headers }).subscribe({
      next: () => {
        this.replyToPostId = null;
        this.replyContent = '';
        this.loadPosts();
      },
      error: (err) => console.error('Erreur création réponse', err)
    });
  }
}
