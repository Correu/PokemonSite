import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  private gameEventSubject = new Subject<any>();

  constructor() {
    this.socket = io('http://localhost:3000'); // or container URL
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('gameEvent', (data) => {
      this.gameEventSubject.next(data);
    });
  }

  joinRoom(roomId: string | null, cb?: (response: any) => void) {
    this.socket.emit('joinRoom', roomId, (response: any) => {
      if (cb) {
        cb(response);
      } else if (response.error) {
        alert(response.error);
      }
    });
  }

  createGame(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket.emit('createRoom', {}, (response: any) => {
        if (response.roomKey) {
          resolve(response.roomKey);
        } else {
          reject('Failed to create room');
        }
      });
    });
  }

  sendGameEvent(roomId: string, data: any) {
    this.socket.emit('gameEvent', { roomId, data });
  }

  onGameEvent(): Observable<any> {
    return this.gameEventSubject.asObservable();
  }

  onPlayerJoined(callback: (playerId: string) => void) {
    this.socket.on('playerJoined', callback);
  }

  sendMessage(roomKey: string, message: string) {
    // Send a message
    this.socket.emit(
      'sendMessage',
      { roomKey: roomKey, message: message },
      (response: any) => {
        if (response.success) {
          console.log('Message sent!');
        } else {
          console.error(response.error);
        }
      }
    );
  }

  onRecievedMessage(callback: (payload: any) => void) {
    // Listen for messages
    this.socket.on('receiveMessage', (payload) => {
      console.log('📨 New message received:', payload);
      callback(payload);
    });
  }

  getSocketId(): string | undefined {
    return this.socket.id;
  }
}
