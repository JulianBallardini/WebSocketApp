import { Injectable, signal } from '@angular/core';
import { User } from '../models/chat.model';
import { WebSocketService } from './websocket.service';
import { API_CONFIG } from '../config/websocket.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'chat_user';
  private readonly TOKEN_KEY = 'jwt_token';
  
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal(false);

  constructor(private wsService: WebSocketService) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);
    
    if (stored && token) {
      const user = JSON.parse(stored);
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
      this.wsService.connect(user.username, token);
    }
  }

  async usernameExists(username: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.URL}${API_CONFIG.USERS.EXISTS(username)}`);
      if (!response.ok) return false;
      const exists = await response.json();
      return exists === true;
    } catch {
      return false;
    }
  }

  async login(username: string, password: string): Promise<void> {
    const response = await fetch(`${API_CONFIG.URL}${API_CONFIG.AUTH.LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login fallido');
    }

    const data = await response.json();
    // { token, username, tag, color, rol }
    
    localStorage.setItem(this.TOKEN_KEY, data.token);
    
    const user: User = {
      id: crypto.randomUUID(),
      username: data.username,
      color: data.color,
      role: data.rol
    };
    
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));

    this.wsService.connect(username, data.token);
  }

  async loginAsGuest(username: string): Promise<void> {
    const exists = await this.usernameExists(username);
    if (exists) {
      throw new Error('El nombre de usuario ya existe. Usa otro o inicia sesión como admin.');
    }

    const user: User = {
      id: crypto.randomUUID(),
      username,
      color: this.generateRandomColor(),
      role: 'USER'
    };
    
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));

    this.wsService.connect(username, '');
  }

  private generateRandomColor(): string {
    const colors = ['blue', 'green', 'magenta', 'purple', 'orange', 'red'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  logout(): void {
    this.wsService.disconnect();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string {
    return localStorage.getItem(this.TOKEN_KEY) || '';
  }

  async deleteAllMessages(): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_CONFIG.URL}${API_CONFIG.CHAT.MENSAJES}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!response.ok) throw new Error('Error al eliminar mensajes');
  }

  async getAutoDeleteSettings(): Promise<boolean> {
    const token = this.getToken();
    const response = await fetch(`${API_CONFIG.URL}${API_CONFIG.CHAT.SETTINGS}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!response.ok) throw new Error('Error al obtener settings');
    const data = await response.json();
    return data.autoDeleteEnabled || false;
  }

  async setAutoDelete(enabled: boolean): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_CONFIG.URL}${API_CONFIG.CHAT.AUTODELETE}?enabled=${enabled}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!response.ok) throw new Error('Error al configurar auto-delete');
  }

  getUsername(): string {
    return this.currentUser()?.username || '';
  }

  getUserColor(): string {
    const color = this.currentUser()?.color;
    if (color) return color;
    return this.generateRandomColor();
  }

  getRole(): string {
    return this.currentUser()?.role || 'USER';
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }
}