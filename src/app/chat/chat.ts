import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatService } from '../services/chat.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { environment } from '../../environments/environment';
 
type Message = { text: string; from: 'user' | 'bot' };
 
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent {
  messages: Message[] = [];
  newMessage = '';
  loading = false;
 
  constructor(
    private chatService: ChatService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}
 
  resetConversation() {
    this.messages = [];
  }
 
  formatMessage(text: string): SafeHtml {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
 
  async sendMessage() {
    const prompt = this.newMessage.trim();
    if (!prompt) return;
 
    const userMsg: Message = { text: prompt, from: 'user' };
    const botMsg: Message = { text: '', from: 'bot' };
 
    this.messages.push(userMsg, botMsg);
    this.newMessage = '';
    this.loading = true;
 
    // 🔁 Construire le prompt contextuel avec l'historique
    const contextPrompt = this.messages
      .map(msg =>
        msg.from === 'user' ? `Utilisateur : ${msg.text}` : `Bot : ${msg.text}`
      )
      .join('\n') + '\nBot :';
 
    try {
      await this.chatService.streamResponse(contextPrompt, (chunk: string) => {
        botMsg.text += chunk;
        this.cdr.detectChanges();
      });
 
      if (/pdf/i.test(prompt)) {
        const pdfBlob = await this.generatePdf(botMsg.text);
        const url = URL.createObjectURL(pdfBlob);
        botMsg.text += `<br><a href="${url}" download="focus-pdf.pdf" target="_blank">📄 Télécharger le PDF</a>`;
      }
    } catch (err) {
      botMsg.text = 'Erreur lors de la génération.';
      console.error(err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
 
  async generatePdf(text: string): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
 
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const lines = text.match(/.{1,100}/g) || [];
 
    page.drawText(lines.join('\n'), {
      x: 50,
      y: height - 50,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      lineHeight: 14,
    });
 
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }
}