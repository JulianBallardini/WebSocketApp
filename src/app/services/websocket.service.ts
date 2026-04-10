import { Injectable, signal } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';

import { ChatMessage, ChatPayload, MessageColor, User } from '../models/chat.model';
import { WS_CONFIG, WS_DESTINATIONS } from '../config/websocket.config';
import { getHexColor, generateMessageId } from '../utils/chat.utils';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private sessionId = crypto.randomUUID();

  readonly messages = signal<ChatMessage[]>([]);
  readonly isConnected = signal(false);
  readonly connectionError = signal<string | null>(null);
  readonly escribiendo = signal('');
  readonly currentUser = signal<User | null>(null);

  private messageSubject = new Subject<ChatMessage>();
  private connectionSubject = new Subject<boolean>();
  private userColor = '';

  connect(username: string, token: string = ''): void {
    if (this.stompClient?.connected) return;

    const connectHeaders: Record<string, string> = token 
      ? { Authorization: 'Bearer ' + token }
      : { username };

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_CONFIG.URL),
      reconnectDelay: WS_CONFIG.RECONNECT_DELAY,
      heartbeatIncoming: WS_CONFIG.HEARTBEAT_INCOMING,
      heartbeatOutgoing: WS_CONFIG.HEARTBEAT_OUTGOING,
      connectHeaders,
      onConnect: () => this.handleConnect(username),
      onDisconnect: () => this.handleDisconnect(),
      onStompError: (frame) => this.handleError(frame)
    });

    this.stompClient.activate();
  }

  private handleConnect(username: string): void {
    this.isConnected.set(true);
    this.connectionError.set(null);
    this.connectionSubject.next(true);
    this.addSystemMessage('Conectado al servidor');
    this.subscribeToChannels();
    this.sendMessage('Nuevo usuario conectado: @' + username, username, 'NEW_USER', '#0000');
  }

  private handleDisconnect(): void {
    this.isConnected.set(false);
    this.connectionSubject.next(false);
    this.addSystemMessage('Desconectado del servidor');
  }

  private handleError(frame: any): void {
    this.connectionError.set(frame.headers['message'] || 'Error de STOMP');
    this.isConnected.set(false);
  }

  private subscribeToChannels(): void {
    this.subscribeToMessages();
    this.subscribeToWriters();
    this.subscribeToHistory();
  }

  private subscribeToHistory(): void {
    if (!this.stompClient) return;

    this.stompClient.subscribe(WS_DESTINATIONS.TOPIC_HISTORIAL(this.sessionId), (response) => {
      const history = this.mapHistoryMessages(response.body);
      this.messages.update(msgs => [...history.reverse(), ...msgs]);
    });

    this.requestHistory();
  }

  private mapHistoryMessages(body: string): ChatMessage[] {
    const data: any[] = JSON.parse(body);
    return data.map(m => ({
      id: m.id || generateMessageId(),
      content: m.texto || m.content || '',
      sender: m.usuario || m.sender || 'Unknown',
      timestamp: new Date(m.fecha || m.timestamp || Date.now()),
      type: (m.tipo || m.type || 'MESSAGE') as ChatMessage['type'],
      color: m.color || 'blue'
    }));
  }

  private requestHistory(): void {
    this.stompClient?.publish({
      destination: WS_DESTINATIONS.HISTORIAL,
      body: this.sessionId
    });
  }

  private subscribeToMessages(): void {
    if (!this.stompClient) return;

    this.stompClient.subscribe(WS_DESTINATIONS.TOPIC_MENSAJE, (response) => {
      const payload: ChatPayload = JSON.parse(response.body);
      const message = this.createMessage(payload);
      
      this.messages.update(msgs => [...msgs, message]);
      this.messageSubject.next(message);

      if (payload.tipo === 'NEW_USER' && payload.usuario === this.getUsername()) {
        this.userColor = payload.color;
      }
    });
  }

  private subscribeToWriters(): void {
    if (!this.stompClient) return;

    this.stompClient.subscribe(WS_DESTINATIONS.TOPIC_ESCRIBIENDO, (response) => {
      this.escribiendo.set(response.body);
      setTimeout(() => this.escribiendo.set(''), 3000);
    });
  }

  private createMessage(payload: ChatPayload): ChatMessage {
    return {
      id: generateMessageId(),
      content: payload.texto,
      sender: payload.usuario,
      timestamp: new Date(payload.fecha),
      type: payload.tipo,
      color: payload.color as MessageColor
    };
  }

  sendMessage(content: string, sender: string, type: ChatMessage['type'], color: string): void {
    if (!this.stompClient?.connected || !content.trim()) return;

    const payload: ChatPayload = {
      texto: content.trim(),
      usuario: sender,
      fecha: Date.now(),
      tipo: type,
      color
    };

    this.stompClient.publish({
      destination: WS_DESTINATIONS.MENSAJE,
      body: JSON.stringify(payload)
    });
  }

  sendTypingEvent(username: string): void {
    this.stompClient?.publish({
      destination: WS_DESTINATIONS.ESCRIBIENDO,
      body: username
    });
  }

  onMessage(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  onConnectionChange(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  disconnect(): void {
    if (this.stompClient) {
      this.addSystemMessage('Desconectando...');
      this.stompClient.deactivate();
      this.stompClient = null;
      this.isConnected.set(false);
    }
  }

  getHexColor(color: string): string {
    return getHexColor(color);
  }

  getUserColor(): string {
    return this.userColor;
  }

  setCurrentUser(user: User): void {
    this.currentUser.set(user);
    this.userColor = user.color;
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  private getUsername(): string {
    return '';
  }

  private addSystemMessage(content: string): void {
    const message: ChatMessage = {
      id: 'id-0',
      content,
      sender: 'Sistema',
      timestamp: new Date(),
      type: 'SYSTEM',
      color: 'red'
    };
    this.messages.update(msgs => [...msgs, message]);
  }
}