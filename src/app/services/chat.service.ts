import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = '/api/generate';

  async streamResponse(prompt: string, onChunk: (text: string) => void): Promise<void> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: prompt,
        stream: true
      })
    });

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Chaque ligne est un JSON chunk
      const parts = buffer.split('\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (part.trim() === '') continue;
        try {
          const json = JSON.parse(part);
          if (json.response) {
            onChunk(json.response); // Appelle ton handler pour chaque morceau
          }
        } catch (e) {
          console.error('Erreur de parsing JSON', part, e);
        }
      }
    }
  }
}
