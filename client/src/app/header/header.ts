import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { AuthDialog } from '../auth-dialog/auth-dialog';
import { Router } from '@angular/router';

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
  showDeleteDialog = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

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

  showDeleteConfirm() {
    this.showDropdown = false;
    this.showDeleteDialog = true;
  }

  cancelDelete() {
    this.showDeleteDialog = false;
  }

  confirmDelete() {
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.showDeleteDialog = false;
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error deleting account:', err);
        alert('Failed to delete account. Please try again.');
        this.showDeleteDialog = false;
      }
    });
  }
}
