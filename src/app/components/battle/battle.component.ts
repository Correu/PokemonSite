import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  BattleActionPayload,
  BattleConfig,
  BattleFormat,
  BattleGameEvent,
  JoinRoomResponse,
} from 'src/app/interfaces/battle';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { BattleStateService } from 'src/app/services/battle/battle-state.service';
import { BattleService } from 'src/app/services/battle/battle.service';
import { SocketService } from 'src/app/services/socket/socket.service';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrls: ['./battle.component.css'],
  standalone: false,
})
export class BattleComponent implements OnInit, OnDestroy {
  currentStep = 1;
  mode: 'choose' | 'create' | 'join' = 'choose';
  battleKey = '';
  joinRoomKey = '';
  joinError = '';
  battleServerUrl = '';

  private playerTeam: Pokemon[] = [];
  private localBattlerIndex = 0;

  levelOptions = Array.from({ length: 100 }, (_, i) => i + 1);
  teamSizeOptions = [1, 2, 3, 4, 5, 6];
  playerCountOptions = [2, 3, 4];
  formatOptions: { value: BattleFormat; label: string }[] = [
    { value: 'singles', label: 'Singles' },
    { value: 'doubles', label: 'Doubles' },
  ];

  battleConfigForm: FormGroup;
  readonly field$ = this.battleState.field$;
  readonly config$ = this.battleState.config$;

  private subs = new Subscription();

  constructor(
    private battleService: BattleService,
    private battleState: BattleStateService,
    private socketService: SocketService,
    private fb: FormBuilder
  ) {
    this.battleConfigForm = this.fb.group({
      level: [50, Validators.required],
      teamSize: [6, Validators.required],
      useItems: [false],
      itemQuantity: [6],
      format: ['singles' as BattleFormat, Validators.required],
      maxPlayers: [2, Validators.required],
      generation: [null as number | null],
    });
  }

  ngOnInit(): void {
    this.battleServerUrl = this.socketService.getServerUrl();
    const socketId = this.socketService.getSocketId();
    if (socketId) {
      this.battleState.setLocalPlayerId(socketId);
    }

    this.subs.add(
      this.socketService.onGameEvent().subscribe((event) => {
        this.handleGameEvent(event);
      })
    );

    this.subs.add(
      this.socketService.onPlayerJoined().subscribe((playerId) => {
        const socketId = this.socketService.getSocketId();
        if (socketId) {
          this.battleState.addPlayer(socketId);
        }
        this.battleState.addPlayer(playerId);
        this.battleState.patchField({
          message: `${this.battleState.playerIds.length}/${this.battleState.requiredPlayerCount()} players connected.`,
        });
      })
    );

    this.subs.add(
      this.socketService.onPlayerLeft().subscribe((playerId) => {
        if (playerId === '__room_closed__') {
          this.battleState.reset();
          this.currentStep = 1;
          this.mode = 'choose';
          return;
        }
        this.battleState.removePlayer(playerId);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get isHost(): boolean {
    return this.battleState.isHost;
  }

  get playerIds(): string[] {
    return this.battleState.playerIds;
  }

  get requiredPlayers(): number {
    return this.battleState.requiredPlayerCount();
  }

  get canStartBattle(): boolean {
    return this.isHost && this.battleState.hasEnoughPlayers();
  }

  applyBattleServerUrl(): void {
    this.socketService.setServerUrl(this.battleServerUrl);
    this.battleServerUrl = this.socketService.getServerUrl();
    const socketId = this.socketService.getSocketId();
    if (socketId) {
      this.battleState.setLocalPlayerId(socketId);
    }
  }

  selectMode(selected: 'create' | 'join'): void {
    this.mode = selected;
    this.currentStep = selected === 'create' ? 2 : 5;
  }

  cancelCreate(): void {
    this.mode = 'choose';
    this.currentStep = 1;
    this.resetConfigForm();
  }

  cancelJoin(): void {
    this.mode = 'choose';
    this.currentStep = 1;
    this.joinRoomKey = '';
    this.joinError = '';
  }

  async submitBattleConfig(): Promise<void> {
    if (!this.battleConfigForm.valid) {
      return;
    }

    try {
      this.battleKey = await this.socketService.createGame();
      const socketId = this.socketService.getSocketId();
      if (socketId) {
        this.battleState.setLocalPlayerId(socketId);
        this.battleState.setPlayerIds([socketId]);
      }
      this.battleState.setRoom(this.battleKey, true);

      const config = this.buildConfigFromForm();
      this.battleState.applyConfig(config);

      this.socketService.sendGameEvent(this.battleKey, {
        type: 'battleConfig',
        config,
      });

      this.currentStep = 3;
    } catch {
      alert('Failed to create room. Check that the battle server is running.');
    }
  }

  tryJoinRoom(): void {
    this.joinError = '';
    this.socketService.joinRoom(this.joinRoomKey, (response: JoinRoomResponse) => {
      if (!response.success) {
        this.joinError = response.error ?? 'Failed to join room.';
        return;
      }

      this.battleKey = this.joinRoomKey;
      const socketId = this.socketService.getSocketId();
      if (socketId) {
        this.battleState.setLocalPlayerId(socketId);
      }
      this.battleState.setRoom(this.battleKey, false);

      if (response.users) {
        this.battleState.setPlayerIds(response.users);
      }
      if (response.battleConfig) {
        this.battleState.applyConfig(response.battleConfig);
      }

      this.socketService.sendGameEvent(this.battleKey, {
        type: 'playerReady',
        ready: true,
      });

      this.currentStep = 4;
    });
  }

  async startBattle(): Promise<void> {
    if (!this.canStartBattle || !this.battleState.config) {
      return;
    }

    this.playerTeam = await this.battleService.buildTeam(this.battleState.config);
    const active = this.battleService.createBattler(
      this.playerTeam[this.localBattlerIndex]!,
      this.battleState.config.level
    );

    this.battleState.setPlayerActive(active);
    this.battleState.startBattleLocally(`Go! ${active.displayName}!`);

    this.socketService.sendGameEvent(this.battleKey, { type: 'battleStart' });
    this.broadcastFieldState(`Go! ${active.displayName}!`);

    this.currentStep = 6;
  }

  onMainAction(action: BattleActionPayload['kind']): void {
    const active = this.battleState.field.playerActive;
    if (!active) {
      return;
    }

    if (action === 'fight') {
      const message = 'Move selection is not available yet.';
      this.battleState.patchField({ message });
      this.emitAction({ kind: 'fight', message });
      return;
    }

    const payload: BattleActionPayload = {
      kind: action,
      message: this.menuMessageForAction(action, active.displayName),
    };
    this.battleState.patchField({ message: payload.message ?? '' });
    this.emitAction(payload);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).catch(() => undefined);
  }

  private handleGameEvent(event: BattleGameEvent): void {
    if (event.senderId === this.socketService.getSocketId()) {
      if (event.type === 'battleConfig') {
        this.currentStep = 3;
      }
      return;
    }

    this.battleState.handleRemoteEvent(event, event.senderId ?? null);

    if (event.type === 'battleConfig' && event.config) {
      this.currentStep = 4;
    }

    if (event.type === 'battleStart') {
      void this.prepareGuestBattle();
      this.currentStep = 6;
    }

    if (event.type === 'battleState' && event.field?.playerActive) {
      this.battleState.setOpponentActive(event.field.playerActive);
      if (event.field.message) {
        this.battleState.patchField({ message: event.field.message });
      }
    }
  }

  private async prepareGuestBattle(): Promise<void> {
    if (!this.battleState.config) {
      return;
    }
    this.playerTeam = await this.battleService.buildTeam(this.battleState.config);
    const active = this.battleService.createBattler(
      this.playerTeam[this.localBattlerIndex]!,
      this.battleState.config.level
    );
    this.battleState.setPlayerActive(active);
    this.battleState.startBattleLocally(`Go! ${active.displayName}!`);
    this.broadcastFieldState(`Go! ${active.displayName}!`);
  }

  private broadcastFieldState(message: string): void {
    if (!this.battleKey) {
      return;
    }
    const field = this.battleState.field;
    this.socketService.sendGameEvent(this.battleKey, {
      type: 'battleState',
      field: {
        playerActive: field.playerActive,
        opponentActive: null,
        message,
        turn: field.turn,
      },
    });
  }

  private emitAction(action: BattleActionPayload): void {
    if (!this.battleKey) {
      return;
    }
    this.socketService.sendGameEvent(this.battleKey, {
      type: 'battleAction',
      action,
    });
  }

  private menuMessageForAction(
    action: BattleActionPayload['kind'],
    name: string
  ): string {
    switch (action) {
      case 'bag':
        return `${name} opened the bag!`;
      case 'switch':
        return `${name} is switching Pokémon!`;
      case 'run':
        return `${name} couldn't get away!`;
      default:
        return `What will ${name} do?`;
    }
  }

  private buildConfigFromForm(): BattleConfig {
    const formValue = this.battleConfigForm.value;
    const useItems = !!formValue.useItems;
    return {
      level: formValue.level,
      teamSize: formValue.teamSize,
      useItems,
      itemQuantity: useItems ? formValue.itemQuantity : 0,
      format: formValue.format,
      maxPlayers: formValue.maxPlayers,
      generation: formValue.generation,
    };
  }

  private resetConfigForm(): void {
    this.battleConfigForm.reset({
      level: 50,
      teamSize: 6,
      useItems: false,
      itemQuantity: 6,
      format: 'singles',
      maxPlayers: 2,
      generation: null,
    });
  }
}
