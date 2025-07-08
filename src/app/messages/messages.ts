import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
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
    console.log('UserID:', this.currentUserId);
    this.waitForTokenAndLoadContacts();
  }
 
  waitForTokenAndLoadContacts(retries: number = 10) {
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('Step1');
      this.loadContacts(token);
      console.log('step4', token);
    } else if (retries > 0) {
      console.warn('Token non disponible. Nouvelle tentative...');
      setTimeout(() => this.waitForTokenAndLoadContacts(retries - 1), 300);
    } else {
      console.error('Token introuvable après plusieurs tentatives.');
      this.loading = false;
    }
  }
 
  async loadContacts(token: string) {
    this.loading = true;
    const headers = { Authorization: `Bearer ${token}` };
 
    console.log('step2');
     this.contacts = await firstValueFrom(this.http.get<Profile[]>(`${this.apiBase}/contacts`, { headers }));
   console.log('step3', this.contacts);
     /*
    this.http.get<Profile[]>(`${this.apiBase}/contacts`, { headers }).subscribe({
      next: (data) => {
        this.contacts = data;
        this.loading = false;
        console.log('step3', this.contacts);
      },
      error: (err) => {
        console.error('Erreur chargement contacts:', err);
        this.loading = false;
      }
    });*/
  }
 
  selectContact(contact: Profile) {
    this.selectedContact = contact;
    this.loadConversation(contact.id);
  }
 
  loadConversation(contactId: string) {
    this.loading = true;
    const token = localStorage.getItem('access_token') || '';
    const headers = { Authorization: `Bearer ${token}` };
 
    this.http.get<PrivateMessage[]>(`${this.apiBase}/${contactId}`, { headers }).subscribe({
      next: (data) => {
        this.conversation = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement conversation:', err);
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
    const headers = { Authorization: `Bearer ${token}` };
 
    this.http.post<PrivateMessage>(this.apiBase, payload, { headers }).subscribe({
      next: (msg) => {
        this.conversation.push(msg);
        this.newMessageContent = '';
      },
      error: (err) => {
        console.error('Erreur envoi message:', err);
      }
    });
  }
}