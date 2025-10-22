import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-dialog.html',
  styleUrls: ['./auth-dialog.css']
})
export class AuthDialog {
  @Output() close = new EventEmitter<void>();
  mode: 'login' | 'signup' = 'login';
  email = '';
  username = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService) {}

  toggleMode() {
    this.mode = this.mode === 'login' ? 'signup' : 'login';
    this.error = null;
  }

  closeDialog() {
    this.close.emit();
  }

  async submit() {
    this.loading = true;
    this.error = null;

    try {
      if (this.mode === 'signup') {
        const res = await this.auth
          .register({ username: this.username, email: this.email, password: this.password })
          .toPromise();

        this.auth.saveToken(res.token);
        window.location.reload();
      } else {
        const res = await this.auth
          .login({ email: this.email, password: this.password })
          .toPromise();

        this.auth.saveToken(res.token);
        window.location.reload();
      }
    } catch (err: any) {
      this.error = err.error?.error || 'Something went wrong. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  googleLogin() {
    this.auth.googleLogin();
  }
}
