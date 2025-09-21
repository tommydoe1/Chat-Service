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

  constructor(private chatService: Chat, private sanitizer: DomSanitizer) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push(this.newMessage.trim());

      this.loading = true;

      this.chatService.sendMessage(this.newMessage).subscribe({
        next: (response) => {
          const rawHtml = marked.parse(response.reply) as string;
          const safeHtml = this.sanitizer.bypassSecurityTrustHtml(rawHtml) as string;
          this.messages.push(safeHtml);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error:', err);
          this.loading = false;
        }
      });

      this.newMessage = '';
    }
  }
}
