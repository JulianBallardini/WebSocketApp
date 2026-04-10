import { MessageColor } from '../models/chat.model';

export const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  magenta: '#ec4899',
  purple: '#a855f7',
  orange: '#f97316',
  gold: '#ffd700'
};

export function getHexColor(color: string): string {
  return COLOR_MAP[color] || '#ffffff';
}

export function generateMessageId(): string {
  return `id-${new Date().getUTCMilliseconds()}-${Math.random().toString(36).substring(2)}`;
}