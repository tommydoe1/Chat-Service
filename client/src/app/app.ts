import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header, Sidebar, ChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
