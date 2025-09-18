import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Chat } from './services/chat';

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

  constructor(private chatService: Chat) {}

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
          this.messages.push(response.reply);
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
