import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // or container URL
  }

  joinRoom(roomId: string | null) {
    this.socket.emit('joinRoom', roomId, (response: any) => {
      if (response.error) alert(response.error);
    });
  }

  createGame(): string {
    let roomKey = '';
    this.socket.emit('createRoom', {}, (response: any) => {
      roomKey = response.roomKey;
    });
    return roomKey;
  }

  sendGameEvent(roomId: string, data: any) {
    this.socket.emit('gameEvent', { roomId, data });
  }

  onGameEvent(callback: (data: any) => void) {
    this.socket.on('gameEvent', callback);
  }

  onPlayerJoined(callback: (playerId: string) => void) {
    this.socket.on('playerJoined', callback);
  }

  sendMessage(message: string) {
    this.socket.emit('test', message);
  }

  getSocketId(): string | undefined {
    return this.socket.id;
  }
}
