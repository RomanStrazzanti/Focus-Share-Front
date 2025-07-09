import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface OlamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

interface OlamaResponse {
  // adapte selon ce que l'API renvoie (ex: un champ "response" ou "text")
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://10.74.18.53:11434/api/generate';

  constructor(private http: HttpClient) {}

  generateResponse(prompt: string): Observable<OlamaResponse> {
    const body: OlamaRequest = {
      model: 'llama3',
      prompt: prompt,
      stream: false
    };
    return this.http.post<OlamaResponse>(this.apiUrl, body);
  }
}
