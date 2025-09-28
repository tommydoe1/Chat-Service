import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Chat } from './services/chat';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  messages: string[] = [];
  newMessage: string = '';
  loading = false;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('chatInput') private chatInput!: ElementRef<HTMLTextAreaElement>;

  constructor(private chatService: Chat, private sanitizer: DomSanitizer) {}

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
      this.messages.push(this.newMessage.trim());
      this.resetTextarea();
      setTimeout(() => this.scrollToBottom(), 0);
      this.loading = true;

      this.chatService.sendMessage(this.newMessage).subscribe({
        next: (response) => {
          const rawHtml = marked.parse(response.reply) as string;
          const safeHtml = this.sanitizer.bypassSecurityTrustHtml(rawHtml) as string;
          this.messages.push(safeHtml);
          this.loading = false;
          setTimeout(() => this.scrollToBottom(), 50);
          setTimeout(() => this.chatInput.nativeElement.focus(), 0);
        },
        error: (err) => {
          console.error('Error:', err);
          let message = 'Unexpected error, please try again.'
          if (err.error?.error) {
            message = `Error: ${err.error.error}`;
          }
          this.messages.push(`<span class="text-red-600">${message}</span>`);
          this.loading = false;
          this.chatInput.nativeElement.focus()
        }
      });
      this.newMessage = '';
    }
  }
}
