export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  type: 'MESSAGE' | 'SYSTEM' | 'NEW_USER';
  color: MessageColor;
}

export type MessageColor = 'red' | 'blue' | 'green' | 'magenta' | 'purple' | 'orange' | 'gold';

export interface ChatPayload {
  texto: string;
  usuario: string;
  fecha: number;
  tipo: 'MESSAGE' | 'SYSTEM' | 'NEW_USER';
  color: string;
}

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  password?: string;
  color: string;
  role: UserRole;
}