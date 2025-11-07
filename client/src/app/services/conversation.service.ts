import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

export interface Conversation {
  id: number;
  title: string;
  userId: number;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private apiUrl = environment.apiUrl;
  private conversationUpdated = new Subject<void>();
  
  conversationUpdated$ = this.conversationUpdated.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token 
      ? new HttpHeaders({ 'Authorization': `Bearer ${token}` })
      : new HttpHeaders();
  }

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(
      `${this.apiUrl}/api/conversations`,
      { headers: this.getHeaders() }
    );
  }

  getConversation(id: number): Observable<Conversation> {
    return this.http.get<Conversation>(
      `${this.apiUrl}/api/conversations/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createConversation(firstMessage: string): Observable<Conversation> {
    return this.http.post<Conversation>(
      `${this.apiUrl}/api/conversations`,
      { firstMessage },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.conversationUpdated.next())
    );
  }

  deleteConversation(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/conversations/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.conversationUpdated.next())
    );
  }
}