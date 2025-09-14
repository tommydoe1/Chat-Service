import { Component, signal } from '@angular/core';
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

  constructor(private chatService: Chat) {}

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push(this.newMessage.trim());

      this.chatService.sendMessage(this.newMessage).subscribe({
        next: (response) => {
          this.messages.push(response.reply);
        },
        error: (err) => console.error('Error:', err),
      });

      this.newMessage = '';
    }
  }
}
