import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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

  constructor(
    private chatService: ChatService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  formatMessage(text: string): SafeHtml {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **gras**
      .replace(/\*(.*?)\*/g, '<em>$1</em>')             // *italique*
      .replace(/\n/g, '<br>');                          // sauts de ligne

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

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
        this.cdr.detectChanges(); // 🔁 force l'affichage du texte en temps réel
      });
    } catch (err) {
      botMessage.text = 'Erreur lors de la génération.';
      console.error(err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges(); // au cas où
    }
  }
}
