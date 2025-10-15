import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { AuthDialog } from '../auth-dialog/auth-dialog';

@Component({
  selector: 'app-header',
  imports: [CommonModule, AuthDialog],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  @Output() toggle = new EventEmitter<void>();
  showDropdown = false;
  showAuthDialog = false;

  constructor(public authService: AuthService) {}

  get user$() {
  return this.authService.user$;
  }

  logout() {
    this.authService.logout();
    this.showDropdown = false;
  }

  onToggleClick() {
    this.toggle.emit();
  }

  toggleAuthDialog() {
    this.showAuthDialog = !this.showAuthDialog;
  }

}
