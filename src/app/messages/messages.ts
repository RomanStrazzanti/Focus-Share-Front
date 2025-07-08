import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Profile {
  id: string;
  pseudo: string;
}

interface PrivateMessage {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrls: ['./messages.css']
})

export class MessagesComponent implements OnInit {
  contacts: Profile[] = [];
  selectedContact: Profile | null = null;
  conversation: PrivateMessage[] = [];
  newMessageContent = '';
  loading = false;

  currentUserId: string | null = '5b681e99-5077-4573-bca7-a5d03c6171e0';
  
  private apiBase = 'http://localhost:3000/api/private-messages';

  constructor(private http: HttpClient) {}

  ngOnInit() {
   console.log('Initialisation des messages...'); 
   console.log('userid:', this.currentUserId);
    this.loadContacts();
  }



  loadContacts() {
    this.loading = true;
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.error('localStorage n\'est pas disponible');
      this.loading = false;
      return;
    }
    const token = localStorage.getItem('access_token') || '';
    console.log('Chargement des contacts...');
    // Vérifie si le token est présent dans localStorage 
    if (!token) {
      console.error('Token manquant');
      this.loading = false;
      return;
    } 
    console.log('Token1:', token);
    const headers  = { Authorization: `Bearer ${token}` }; 
   
    this.http.get<Profile[]>(`${this.apiBase}/contacts`, { headers }).subscribe({
      next: (data) => {
        this.contacts = data;
        this.loading = false;
        console.log('Contacts chargés:', this.contacts);
      },
      error: (err) => {
        console.error('Erreur chargement contacts', err);
        this.loading = false;
      }
    });
  }

 selectContact(contact: Profile) {
    this.selectedContact = contact;
    this.loadConversation(contact.id);
  }

  loadConversation(contactId: string) {
    this.loading = true;
     const token = localStorage.getItem('access_token') || '';
  const headers  = { Authorization: `Bearer ${token}` };
    this.http.get<PrivateMessage[]>(`${this.apiBase}/${contactId}`,{ headers }).subscribe({
      next: (data) => {
        this.conversation = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement conversation', err);
        this.loading = false;
      }
    });
  }

  sendMessage() {
    if (!this.newMessageContent.trim() || !this.selectedContact) return;

    const payload = {
      receiver_id: this.selectedContact.id,
      content: this.newMessageContent.trim(),
    };

  const token = localStorage.getItem('access_token') || '';
  const headers  = { Authorization: `Bearer ${token}` };

    this.http.post<PrivateMessage>(this.apiBase, payload, { headers } ).subscribe({
      next: (msg) => {
        this.conversation.push(msg);
        this.newMessageContent = '';
      },
      error: (err) => {
        console.error('Erreur envoi message', err);
      }
    });
  }
}
