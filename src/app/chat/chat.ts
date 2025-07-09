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

  async sendMessage() {
    const prompt = this.newMessage.trim();
    if (!prompt) return;

    this.messages.push({ text: prompt, from: 'user' });
    this.newMessage = '';
    this.loading = true;

    const botMessage = { text: '', from: 'bot' as const };
    this.messages.push(botMessage);

    try {
      await this.chatService.streamResponse(prompt, (chunk: string) => {
        botMessage.text += chunk;
      });
    } catch (err) {
      botMessage.text = 'Erreur lors de la génération.';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
