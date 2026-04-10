import { Component, ViewChild, ElementRef, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnDestroy, OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  userColor = '';
  messageInput = '';
  showScrollButton = false;
  autoDeleteEnabled = signal(false);
  private isAtBottom = true;
  private messageSub?: Subscription;

  constructor(
    public wsService: WebSocketService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userColor = this.authService.getUserColor() || 'blue';
    if (this.authService.isAdmin()) {
      this.loadAutoDeleteSettings();
    }
    
    this.messageSub = this.wsService.onMessage().subscribe(() => {
      if (this.isAtBottom) {
        setTimeout(() => this.scrollToBottom(), 10);
      }
    });

    setTimeout(() => this.scrollToBottom(), 100);
  }

  private async loadAutoDeleteSettings(): Promise<void> {
    try {
      const enabled = await this.authService.getAutoDeleteSettings();
      this.autoDeleteEnabled.set(enabled);
    } catch (e) {
      console.error('Error cargando settings:', e);
    }
  }

  async deleteMessages(): Promise<void> {
    if (!confirm('¿Eliminar todo el historial de mensajes?')) return;
    try {
      await this.authService.deleteAllMessages();
      this.wsService.messages.set([]);
      alert('Historial eliminado');
    } catch (e: any) {
      alert(e.message);
    }
  }

  async toggleAutoDelete(): Promise<void> {
    const newValue = !this.autoDeleteEnabled();
    try {
      await this.authService.setAutoDelete(newValue);
      this.autoDeleteEnabled.set(newValue);
    } catch (e: any) {
      alert(e.message);
    }
  }

  onScroll() {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
      this.isAtBottom = atBottom;
      this.showScrollButton = !atBottom;
    }
  }

  ngOnDestroy(): void {
    this.messageSub?.unsubscribe();
    this.wsService.disconnect();
  }

  sendMessage(): void {
    if (!this.messageInput.trim()) return;

    const username = this.authService.getUsername();
    this.wsService.sendMessage(this.messageInput, username, 'MESSAGE', this.userColor);
    this.messageInput = '';
    setTimeout(() => this.scrollToBottom(), 50);
  }

  formatTime(date: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  onTyping(): void {
    this.wsService.sendTypingEvent(this.authService.getUsername());
  }

  disconnect(): void {
    this.wsService.disconnect();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
