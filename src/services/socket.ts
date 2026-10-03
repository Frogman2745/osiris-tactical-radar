import { ConnectedUser, ActivityLog, PipelineRunStatus } from '../types';

export type SocketEventHandler = (data: any) => void;

class RealtimeSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SocketEventHandler>> = new Map();
  private reconnectTimer: any = null;
  private isConnecting: boolean = false;
  private currentUser: ConnectedUser | null = null;

  constructor() {
    this.connect();
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.emitLocal('connection:status', { connected: true });
        
        // Re-identify if user exists
        if (this.currentUser) {
          this.identify(this.currentUser.name, this.currentUser.role);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.emitLocal(payload.type, payload.data || payload);
        } catch (e) {
          console.error('Failed to parse websocket message', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.emitLocal('connection:status', { connected: false });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        this.emitLocal('connection:status', { connected: false, error: err });
      };
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 2500);
  }

  public on(event: string, handler: SocketEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emitLocal(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (err) {
          console.error(`Error in socket listener for ${event}:`, err);
        }
      });
    }
  }

  public send(type: string, data: Record<string, any> = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  public identify(name: string, role: string) {
    this.currentUser = {
      id: this.currentUser?.id || 'usr-local',
      name,
      role,
      color: this.currentUser?.color || '#06b6d4',
    };
    this.send('presence:identify', { name, role });
  }

  public sendReportEdit(markdown: string, author: string) {
    this.send('report:edit', { markdown, author });
  }

  public triggerPipeline() {
    this.send('pipeline:trigger');
  }

  public postActivity(action: string, category: string, user?: string) {
    this.send('activity:post', { action, category, user });
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const realtimeSocket = new RealtimeSocketClient();
