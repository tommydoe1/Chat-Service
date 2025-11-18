import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from './services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from './environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header, Sidebar, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  isSidebarOpen = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.handleGoogleAuth(token);
      }
    });
  }

  private async handleGoogleAuth(token: string) {
    try {
      localStorage.setItem('token', token);
      
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      
      this.http.get(`${environment.apiUrl}/api/auth/me`, { headers }).subscribe({
        next: (user: any) => {
          localStorage.setItem('user', JSON.stringify(user));
          
          this.authService.userSubject.next(user);
          
          this.router.navigate(['/'], { 
            queryParams: {}, 
            replaceUrl: true 
          }).then(() => {
            window.location.reload();
          });
        },
        error: (err) => {
          console.error('Error fetching user data:', err);
          localStorage.removeItem('token');
        }
      });
    } catch (error) {
      console.error('Error handling Google auth:', error);
      localStorage.removeItem('token');
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
