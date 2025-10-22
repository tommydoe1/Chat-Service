import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ConversationService } from '../services/conversation.service';

interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  @Input() isOpen = false;
  conversations: Conversation[] = [];
  isAuthenticated = false;

  constructor(
    private conversationService: ConversationService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.isAuthenticated = this.authService.isAuthenticated();
    
    if (this.isAuthenticated) {
      this.loadConversations();
    }

    this.authService.user$.subscribe(user => {
      this.isAuthenticated = !!user;
      if (this.isAuthenticated) {
        this.loadConversations();
      } else {
        this.conversations = [];
      }
    });
  }

  loadConversations() {
    this.conversationService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
      },
      error: (err) => {
        console.error('Error loading conversations:', err);
      }
    });
  }
}