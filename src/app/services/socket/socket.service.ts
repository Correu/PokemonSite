import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
<<<<<<< HEAD
import { BattleGameEvent, JoinRoomResponse } from 'src/app/interfaces/battle';
import { environment } from 'src/environments/environment';

const BATTLE_SOCKET_STORAGE_KEY = 'pokemonBattleSocketUrl';
=======
import { GameEventEnvelope } from 'src/app/interfaces/battle-event';
>>>>>>> 5883c18d2539c58b2d2b52b4aedc19cb59bcf4f1

@Injectable({
  providedIn: 'root',
})
export class SocketService {
<<<<<<< HEAD
  private socket!: Socket;
  private currentUrl: string;
  private gameEventSubject = new Subject<BattleGameEvent>();
  private playerJoinedSubject = new Subject<string>();
  private playerLeftSubject = new Subject<string>();
=======
  private socket: Socket;
  private gameEventSubject = new Subject<GameEventEnvelope>();
>>>>>>> 5883c18d2539c58b2d2b52b4aedc19cb59bcf4f1

  constructor() {
    this.currentUrl = this.resolveInitialUrl();
    this.socket = io(this.currentUrl);
    this.attachSocketListeners();
  }

<<<<<<< HEAD
  getServerUrl(): string {
    return this.currentUrl;
=======
  private setupSocketListeners() {
    this.socket.on('gameEvent', (data: GameEventEnvelope) => {
      this.gameEventSubject.next(data);
    });
>>>>>>> 5883c18d2539c58b2d2b52b4aedc19cb59bcf4f1
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

<<<<<<< HEAD
  sendGameEvent(roomId: string, data: BattleGameEvent): void {
    this.socket.emit('gameEvent', { roomId, data });
  }

  onGameEvent(): Observable<BattleGameEvent> {
=======
  sendGameEvent(roomId: string, event: GameEventEnvelope) {
    this.socket.emit('gameEvent', { roomId, data: event });
  }

  onGameEvent(): Observable<GameEventEnvelope> {
>>>>>>> 5883c18d2539c58b2d2b52b4aedc19cb59bcf4f1
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
      }
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
