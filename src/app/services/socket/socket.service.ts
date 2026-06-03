import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { BattleGameEvent, JoinRoomResponse } from 'src/app/interfaces/battle';
import { GameEventEnvelope } from 'src/app/interfaces/battle-event';

export type SocketGameEvent = BattleGameEvent | GameEventEnvelope;
import { environment } from 'src/environments/environment';

const BATTLE_SOCKET_STORAGE_KEY = 'pokemonBattleSocketUrl';
const DEFAULT_ACK_TIMEOUT_MS = 15_000;

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private currentUrl: string;
  private gameEventSubject = new Subject<SocketGameEvent>();
  private playerJoinedSubject = new Subject<string>();
  private playerLeftSubject = new Subject<string>();
  private connectionSubject = new Subject<boolean>();

  constructor() {
    this.currentUrl = this.resolveInitialUrl();
    this.socket = this.createSocket(this.currentUrl);
    this.attachSocketListeners();
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  onConnectionChange(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  getServerUrl(): string {
    return this.currentUrl;
  }

  setServerUrl(url: string): void {
    const trimmed = url.trim();
    if (!trimmed) {
      return;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BATTLE_SOCKET_STORAGE_KEY, trimmed);
    }
    if (trimmed === this.currentUrl && this.socket.connected) {
      return;
    }
    this.currentUrl = trimmed;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = this.createSocket(trimmed);
    this.attachSocketListeners();
  }

  getSocketId(): string | undefined {
    return this.socket.id;
  }

  waitUntilConnected(timeoutMs = DEFAULT_ACK_TIMEOUT_MS): Promise<void> {
    if (this.socket.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `Could not connect to ${this.currentUrl}. Start PokemonSiteServer and verify the battle server URL.`
          )
        );
      }, timeoutMs);

      const onConnect = () => {
        cleanup();
        resolve();
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.socket.off('connect', onConnect);
      };

      this.socket.on('connect', onConnect);
      this.socket.connect();
    });
  }

  joinRoom(roomId: string, cb?: (response: JoinRoomResponse) => void): void {
    this.emitWithAck<JoinRoomResponse>('joinRoom', roomId)
      .then((response) => {
        if (cb) {
          cb(response);
        } else if (response.error) {
          alert(response.error);
        }
      })
      .catch((err) => {
        if (cb) {
          cb({ error: this.errorMessage(err) });
        } else {
          alert(this.errorMessage(err));
        }
      });
  }

  createGame(): Promise<string> {
    return this.waitUntilConnected().then(
      () =>
        this.emitWithAck<{ roomKey?: string }>('createRoom', {}).then((response) => {
          if (response.roomKey) {
            return response.roomKey;
          }
          throw new Error('Server did not return a room code.');
        })
    );
  }

  sendGameEvent(roomId: string, data: SocketGameEvent): void {
    if (!this.socket.connected) {
      console.warn('Socket not connected; game event not sent.', data.type);
      return;
    }
    this.socket.emit('gameEvent', { roomId, data });
  }

  onGameEvent(): Observable<SocketGameEvent> {
    return this.gameEventSubject.asObservable();
  }

  onPlayerJoined(): Observable<string> {
    return this.playerJoinedSubject.asObservable();
  }

  onPlayerLeft(): Observable<string> {
    return this.playerLeftSubject.asObservable();
  }

  sendMessage(roomKey: string, message: string): void {
    this.emitWithAck('sendMessage', { roomKey, message }).catch((err) => {
      console.error(this.errorMessage(err));
    });
  }

  private createSocket(url: string): Socket {
    return io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10_000,
    });
  }

  private emitWithAck<T>(event: string, payload: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket.connected) {
        reject(new Error('Not connected to the battle server.'));
        return;
      }

      const timer = setTimeout(() => {
        reject(
          new Error(
            `Request timed out (${event}). Is PokemonSiteServer running at ${this.currentUrl}?`
          )
        );
      }, DEFAULT_ACK_TIMEOUT_MS);

      this.socket.emit(event, payload, (response: T) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  }

  private errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Battle server request failed.';
  }

  private resolveInitialUrl(): string {
    if (typeof window === 'undefined') {
      return environment.socketUrl;
    }
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('socketUrl')?.trim();
    if (fromQuery) {
      localStorage.setItem(BATTLE_SOCKET_STORAGE_KEY, fromQuery);
      return fromQuery;
    }
    const stored = localStorage.getItem(BATTLE_SOCKET_STORAGE_KEY)?.trim();
    if (stored) {
      return stored;
    }
    return environment.socketUrl;
  }

  private attachSocketListeners(): void {
    this.socket.on('connect', () => {
      this.connectionSubject.next(true);
    });
    this.socket.on('disconnect', () => {
      this.connectionSubject.next(false);
    });
    this.socket.on('connect_error', () => {
      this.connectionSubject.next(false);
    });

    this.socket.on('gameEvent', (data: SocketGameEvent) => {
      this.gameEventSubject.next(data);
    });
    this.socket.on('playerJoined', (playerId: string) => {
      this.playerJoinedSubject.next(playerId);
    });
    this.socket.on('playerLeft', (playerId: string) => {
      this.playerLeftSubject.next(playerId);
    });
    this.socket.on('roomClosed', () => {
      this.playerLeftSubject.next('__room_closed__');
    });

    if (this.socket.connected) {
      this.connectionSubject.next(true);
    }
  }
}
