import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { BattleGameEvent, JoinRoomResponse } from 'src/app/interfaces/battle';
import { environment } from 'src/environments/environment';

const BATTLE_SOCKET_STORAGE_KEY = 'pokemonBattleSocketUrl';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private currentUrl: string;
  private gameEventSubject = new Subject<BattleGameEvent>();
  private playerJoinedSubject = new Subject<string>();
  private playerLeftSubject = new Subject<string>();

  constructor() {
    this.currentUrl = this.resolveInitialUrl();
    this.socket = io(this.currentUrl);
    this.attachSocketListeners();
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
    this.socket = io(trimmed);
    this.attachSocketListeners();
  }

  getSocketId(): string | undefined {
    return this.socket.id;
  }

  joinRoom(roomId: string, cb?: (response: JoinRoomResponse) => void): void {
    this.socket.emit('joinRoom', roomId, (response: JoinRoomResponse) => {
      if (cb) {
        cb(response);
      } else if (response.error) {
        alert(response.error);
      }
    });
  }

  createGame(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket.emit('createRoom', {}, (response: { roomKey?: string }) => {
        if (response.roomKey) {
          resolve(response.roomKey);
        } else {
          reject('Failed to create room');
        }
      });
    });
  }

  sendGameEvent(roomId: string, data: BattleGameEvent): void {
    this.socket.emit('gameEvent', { roomId, data });
  }

  onGameEvent(): Observable<BattleGameEvent> {
    return this.gameEventSubject.asObservable();
  }

  onPlayerJoined(): Observable<string> {
    return this.playerJoinedSubject.asObservable();
  }

  onPlayerLeft(): Observable<string> {
    return this.playerLeftSubject.asObservable();
  }

  sendMessage(roomKey: string, message: string): void {
    this.socket.emit(
      'sendMessage',
      { roomKey, message },
      (response: { success?: boolean; error?: string }) => {
        if (!response.success) {
          console.error(response.error);
        }
      },
    );
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
    this.socket.on('gameEvent', (data: BattleGameEvent) => {
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
  }
}
