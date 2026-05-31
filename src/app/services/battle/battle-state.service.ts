import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  BattleActionPayload,
  BattleConfig,
  BattleFieldState,
  BattleGameEvent,
  BattlePhase,
} from 'src/app/interfaces/battle';

const EMPTY_FIELD: BattleFieldState = {
  playerActive: null,
  opponentActive: null,
  message: 'Select Create or Join to begin.',
  turn: 0,
};

@Injectable({
  providedIn: 'root',
})
export class BattleStateService {
  private phaseSubject = new BehaviorSubject<BattlePhase>('idle');
  private fieldSubject = new BehaviorSubject<BattleFieldState>({ ...EMPTY_FIELD });
  private configSubject = new BehaviorSubject<BattleConfig | null>(null);

  readonly phase$ = this.phaseSubject.asObservable();
  readonly field$ = this.fieldSubject.asObservable();
  readonly config$ = this.configSubject.asObservable();

  roomKey = '';
  isHost = false;
  localPlayerId = '';
  playerIds: string[] = [];

  get phase(): BattlePhase {
    return this.phaseSubject.value;
  }

  get field(): BattleFieldState {
    return this.fieldSubject.value;
  }

  get config(): BattleConfig | null {
    return this.configSubject.value;
  }

  reset(): void {
    this.roomKey = '';
    this.isHost = false;
    this.localPlayerId = '';
    this.playerIds = [];
    this.phaseSubject.next('idle');
    this.configSubject.next(null);
    this.fieldSubject.next({ ...EMPTY_FIELD });
  }

  setLocalPlayerId(id: string): void {
    this.localPlayerId = id;
  }

  setRoom(roomKey: string, isHost: boolean): void {
    this.roomKey = roomKey;
    this.isHost = isHost;
    this.phaseSubject.next(isHost ? 'lobby' : 'waiting');
  }

  applyConfig(config: BattleConfig): void {
    this.configSubject.next(config);
    this.patchField({ message: 'Waiting for players to join…' });
    this.phaseSubject.next('waiting');
  }

  setPlayerIds(ids: string[]): void {
    this.playerIds = ids;
  }

  addPlayer(id: string): void {
    if (!this.playerIds.includes(id)) {
      this.playerIds = [...this.playerIds, id];
    }
  }

  removePlayer(id: string): void {
    this.playerIds = this.playerIds.filter((pid) => pid !== id);
  }

  requiredPlayerCount(): number {
    return this.config?.maxPlayers ?? 2;
  }

  hasEnoughPlayers(): boolean {
    return this.playerIds.length >= this.requiredPlayerCount();
  }

  startBattleLocally(message: string): void {
    this.phaseSubject.next('active');
    this.patchField({ message, turn: 1 });
  }

  patchField(patch: Partial<BattleFieldState>): void {
    this.fieldSubject.next({ ...this.fieldSubject.value, ...patch });
  }

  setPlayerActive(battler: BattleFieldState['playerActive']): void {
    this.patchField({ playerActive: battler });
  }

  setOpponentActive(battler: BattleFieldState['opponentActive']): void {
    this.patchField({ opponentActive: battler });
  }

  handleRemoteEvent(event: BattleGameEvent, opponentId: string | null): void {
    switch (event.type) {
      case 'battleConfig':
        if (event.config) {
          this.applyConfig(event.config);
        }
        break;

      case 'battleStart':
        this.startBattleLocally('A wild battle begins!');
        break;

      case 'battleState':
        if (event.senderId && event.senderId !== this.localPlayerId && event.field?.playerActive) {
          this.setOpponentActive(event.field.playerActive);
        }
        if (event.field?.message) {
          this.patchField({ message: event.field.message });
        }
        break;

      case 'battleAction':
        if (event.senderId && event.senderId !== this.localPlayerId && event.action?.message) {
          this.patchField({ message: event.action.message });
        }
        break;

      case 'playerReady':
        if (event.senderId && event.senderId !== this.localPlayerId) {
          this.addPlayer(event.senderId);
        }
        break;
    }

    if (opponentId && event.senderId === opponentId) {
      // opponent-specific handling already applied above
    }
  }

  buildActionMessage(action: BattleActionPayload, battlerName: string): string {
    if (action.kind === 'run') {
      return `${battlerName} got away!`;
    }
    if (action.message) {
      return action.message;
    }
    return `${battlerName} is waiting…`;
  }
}
