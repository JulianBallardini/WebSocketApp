import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    this.error.set('');
    
    if (!this.username.trim()) {
      this.error.set('El nombre de usuario es obligatorio');
      return;
    }

    this.loading.set(true);

    try {
      if (this.password.trim()) {
        await this.authService.login(this.username, this.password);
      } else {
        await this.authService.loginAsGuest(this.username);
      }
      this.router.navigate(['/chat']);
    } catch (err: any) {
      this.error.set(err.message || 'Error al iniciar sesión');
      this.loading.set(false);
    }
  }
}