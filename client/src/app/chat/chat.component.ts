import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatService } from '../services/chat.service';
import { ConversationService, type Message } from '../services/conversation.service';
import { AuthService } from '../services/auth.service';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | SafeHtml;
  isHtml?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  newMessage: string = '';
  loading = false;
  guestWarning: string | null = null;
  currentConversationId: number | undefined;
  private routeSubscription?: Subscription;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('chatInput') private chatInput!: ElementRef<HTMLTextAreaElement>;

  constructor(
    private chatService: ChatService,
    private conversationService: ConversationService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.routeSubscription = this.route.params.subscribe(params => {
      const conversationId = params['id'];
      if (conversationId) {
        this.loadConversation(parseInt(conversationId));
      } else {
        this.messages = [];
        this.currentConversationId = undefined;
      }
    });

    this.route.queryParams.subscribe(params => {
      const prompt = params['prompt'];
      if (prompt && this.messages.length === 0) {
        this.newMessage = prompt;
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  get isGuest(): boolean {
    return !this.authService.isAuthenticated();
  }

  loadConversation(conversationId: number) {
    this.conversationService.getConversation(conversationId).subscribe({
      next: (conversation) => {
        this.currentConversationId = conversation.id;
        this.messages = conversation.messages?.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.role === 'assistant' 
            ? this.sanitizer.bypassSecurityTrustHtml(marked.parse(msg.content) as string)
            : msg.content,
          isHtml: msg.role === 'assistant'
        })) || [];
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Error loading conversation:', err);
        this.router.navigate(['/']);
      }
    });
  }

  private scrollToBottom() {
    try {
      setTimeout(() => {
        this.chatContainer.nativeElement.scrollTo({
          top: this.chatContainer.nativeElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 0);
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }

  resetTextarea() {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      (textarea as HTMLTextAreaElement).style.height = 'auto';
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!this.loading) {
        this.sendMessage();
      }
    }
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({
        role: 'user',
        content: this.newMessage.trim()
      });
      
      const messageToSend = this.newMessage;
      this.newMessage = '';
      this.resetTextarea();
      setTimeout(() => this.scrollToBottom(), 0);
      this.loading = true;
      this.guestWarning = null;

      this.chatService.sendMessage(messageToSend, this.currentConversationId).subscribe({
        next: (response) => {
          const rawHtml = marked.parse(response.reply) as string;
          const safeHtml = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
          
          this.messages.push({
            role: 'assistant',
            content: safeHtml,
            isHtml: true
          });
          
          if (response.conversationId && !this.currentConversationId) {
            this.currentConversationId = response.conversationId;
            if (!this.isGuest) {
              this.router.navigate(['/chat', response.conversationId], { replaceUrl: true });
            }
          }
          
          if (response.message) {
            this.guestWarning = response.message;
          }
          
          this.loading = false;
          setTimeout(() => this.scrollToBottom(), 50);
          setTimeout(() => this.chatInput.nativeElement.focus(), 0);
        },
        error: (err) => {
          console.error('Error:', err);
          let message = 'Unexpected error, please try again.';
          if (err.error?.error) {
            message = `Error: ${err.error.error}`;
          }
          
          this.messages.push({
            role: 'assistant',
            content: this.sanitizer.bypassSecurityTrustHtml(`<span class="text-red-600">${message}</span>`),
            isHtml: true
          });
          
          this.loading = false;
          this.chatInput.nativeElement.focus();
        }
      });
    }
  }
}