import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { WebSocketService } from '../../services/websocket.service';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let wsService: jasmine.SpyObj<WebSocketService>;

  beforeEach(async () => {
    const messageSubject = new Subject<any>();

    wsService = jasmine.createSpyObj('WebSocketService', [
      'connect',
      'disconnect',
      'sendMessage',
      'onMessage',
      'onConnectionChange'
    ]);

    wsService.isConnected.and.returnValue(false);
    wsService.messages.and.returnValue([] as any);
    wsService.connectionError.and.returnValue(null);
    wsService.onMessage.and.returnValue(messageSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [ChatComponent, FormsModule],
      providers: [{ provide: WebSocketService, useValue: wsService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty username initially', () => {
    expect(component.username).toBe('');
  });

  it('should have empty messageInput initially', () => {
    expect(component.messageInput).toBe('');
  });

  it('should call connect on wsService when connect() is called', () => {
    component.username = 'TestUser';
    component.connect();
    expect(wsService.connect).toHaveBeenCalledWith('TestUser');
  });

  it('should call disconnect on wsService when disconnect() is called', () => {
    component.disconnect();
    expect(wsService.disconnect).toHaveBeenCalled();
  });

  it('should call sendMessage on wsService when sendMessage() is called', () => {
    component.username = 'TestUser';
    component.messageInput = 'Hello';
    component.sendMessage();
    expect(wsService.sendMessage).toHaveBeenCalledWith('Hello', 'TestUser');
  });

  it('should clear messageInput after sending', () => {
    component.messageInput = 'Hello';
    component.sendMessage();
    expect(component.messageInput).toBe('');
  });

  it('should format time correctly', () => {
    const date = new Date('2024-01-15T14:30:00');
    const formatted = component.formatTime(date);
    expect(formatted).toContain('14:30');
  });
});