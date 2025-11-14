import { Component, ViewChild, ElementRef, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatService } from '../services/chat.service';
import { ConversationService, type Message } from '../services/conversation.service';
import { AuthService } from '../services/auth.service';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';

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
  styleUrl: './chat.css',
  encapsulation: ViewEncapsulation.None
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  newMessage: string = '';
  loading = false;
  guestWarning: string | null = null;
  currentConversationId: number | undefined;
  currentModel: string = 'gpt-4o-mini';
  dropdownOpen = false;
  modelLocked = false;
  availableModels: Record<
  string,
  { name: string; description: string }
> = {
    "gpt-4o-mini": { 
      name: "GPT-4o Mini", 
      description: "Balanced and reliable for everyday use. Great at conversation, coding help, writing, and problem-solving." 
    },
    "llama3": { 
      name: "Llama 3.1-8B Instant", 
      description: "Fastest responses. Best when you want quick answers, brainstorming, coding, or rapid back-and-forth chats." 
    },
    "gemini": { 
      name: "Gemini 2.0 Flash", 
      description: "Great for structured responses, creative writing, analysis, and generating clear explanations." 
    }
  };
  private routeSubscription?: Subscription;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('chatInput') private chatInput!: ElementRef<HTMLTextAreaElement>;

  constructor(
    private chatService: ChatService,
    private conversationService: ConversationService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title
  ) {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  ngOnInit() {

    this.routeSubscription = this.route.params.subscribe(params => {
      const conversationId = params['id'];
      if (conversationId) {
        this.loadConversation(parseInt(conversationId));
      } else {
        this.messages = [];
        this.currentConversationId = undefined;
        this.titleService.setTitle('New Chat – AI Chat Service');
        this.currentModel = 'gpt-4o-mini';
        this.modelLocked = false;
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

  toggleDropdown() {
    if (!this.modelLocked) {
      this.dropdownOpen = !this.dropdownOpen;
    }
  }

  selectModel(key: string) {
    if (!this.modelLocked) {
      this.currentModel = key;
      this.dropdownOpen = false;
    }
  }

  get isGuest(): boolean {
    return !this.authService.isAuthenticated();
  }

  loadConversation(conversationId: number) {
    this.conversationService.getConversation(conversationId).subscribe({
      next: (conversation) => {
        this.currentConversationId = conversation.id;
        this.currentModel = (conversation as any).model || 'gpt-4o-mini';
        this.modelLocked = true;
        this.messages = conversation.messages?.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.role === 'assistant' 
            ? this.sanitizer.bypassSecurityTrustHtml(marked.parse(msg.content) as string)
            : msg.content,
          isHtml: msg.role === 'assistant'
        })) || [];
        this.titleService.setTitle(`${conversation.title || 'Chat'} – AI Chat Service`);
        setTimeout(() => {
          this.scrollToBottom();
          this.addCopyButtons();
        }, 100);
      },
      error: (err) => {
        console.error('Error loading conversation:', err);
        this.router.navigate(['/']);
        this.titleService.setTitle('AI Chat Service');
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

      if (this.messages.length === 1) {
        this.modelLocked = true;
      }

      this.chatService.sendMessage(messageToSend, this.currentConversationId, this.currentModel).subscribe({
        next: (response) => {
          const rawHtml = marked.parse(response.reply) as string;
          const safeHtml = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
          
          this.messages.push({
            role: 'assistant',
            content: safeHtml,
            isHtml: true
          });

          setTimeout(() => this.addCopyButtons(), 100);
          
          if (response.conversationId && !this.currentConversationId) {
            this.currentConversationId = response.conversationId;
            this.currentModel = response.model || this.currentModel;
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

  private addCopyButtons() {
    const codeBlocks = this.chatContainer.nativeElement.querySelectorAll('pre:not(.has-copy-button)');
    
    codeBlocks.forEach((pre: HTMLElement) => {
      pre.classList.add('has-copy-button');
      const codeElement = pre.querySelector('code');
      
      if (codeElement) {
        if (typeof (window as any).hljs !== 'undefined') {
          const hljs = (window as any).hljs;
          try {
            hljs.highlightElement(codeElement);
          } catch (err) {
            console.error('Syntax highlighting error:', err);
          }
        }
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy</span>
        `;
        
        button.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.copyCode(codeElement, button);
        };
        
        pre.appendChild(button);
      }
    });
  }

  private copyCode(codeBlock: HTMLElement, button: HTMLElement) {
    const code = codeBlock.textContent || '';
    navigator.clipboard.writeText(code).then(() => {
      const span = button.querySelector('span');
      if (span) {
        span.textContent = 'Copied!';
        button.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
          span.textContent = 'Copy';
          button.style.backgroundColor = '';
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}