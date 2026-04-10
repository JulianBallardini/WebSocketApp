import { environment } from '../environments/environment';

export const API_CONFIG = {
  URL: environment.apiUrl,
  AUTH: {
    LOGIN: '/auth/login'
  },
  USERS: {
    EXISTS: (username: string) => `/usuarios/exists/${username}`
  },
  CHAT: {
    MENSAJES: '/chat/mensajes',
    SETTINGS: '/chat/settings',
    AUTODELETE: '/chat/autodelete'
  }
} as const;

export const WS_CONFIG = {
  URL: environment.wsUrl,
  RECONNECT_DELAY: 5000,
  HEARTBEAT_INCOMING: 5000,
  HEARTBEAT_OUTGOING: 5000
} as const;

export const COLOR_HEX_MAP: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  magenta: '#ec4899',
  purple: '#a855f7',
  orange: '#f97316',
  gold: '#fbbf24'
} as const;

export const WS_DESTINATIONS = {
  MENSAJE: '/app/mensaje',
  ESCRIBIENDO: '/app/escribiendo',
  HISTORIAL: '/app/historial',
  TOPIC_MENSAJE: '/chat/mensaje',
  TOPIC_ESCRIBIENDO: '/chat/escribiendo',
  TOPIC_HISTORIAL: (id: string) => `/chat/historial/${id}`
} as const;

export const CHAT_CONFIG = {
  MAX_HISTORY_MESSAGES: 10,
  WRITER_TIMEOUT_MS: 3000,
  SCROLL_DELAY_MS: 50,
  TYPING_DEBOUNCE_MS: 300
} as const;