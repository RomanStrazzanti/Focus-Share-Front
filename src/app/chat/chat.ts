import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent {
  messages: { text: string; from: 'user' | 'bot' }[] = [];
  newMessage = '';
  loading = false;

  constructor(private chatService: ChatService) {}

  sendMessage() {
    const prompt = this.newMessage.trim();
    if (!prompt) return;

    // Ajouter le message utilisateur à la liste
    this.messages.push({ text: prompt, from: 'user' });
    this.newMessage = '';
    this.loading = true;

    // Appeler l’API Olama
    this.chatService.generateResponse(prompt).subscribe({
      next: (res) => {
        this.messages.push({ text: res.response, from: 'bot' });
        this.loading = false;
      },
      error: (err) => {
        this.messages.push({ text: 'Erreur lors de la requête', from: 'bot' });
        this.loading = false;
      }
    });
  }
}
