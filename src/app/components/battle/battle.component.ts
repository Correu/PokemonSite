import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
import { isGameEventEnvelope } from 'src/app/interfaces/battle-event';
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
  socketConnected = false;
  creatingRoom = false;
  createRoomError = '';

  teamOptions: Pokemon[] = [];
  selectedTeamIndex: number | null = null;
  localSelectionConfirmed = false;
  opponentSelectionConfirmed = false;
  teamSelectLoading = false;

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
  readonly phase$ = this.battleState.phase$;

  private subs = new Subscription();
  private teamSelectEntered = false;

  constructor(
    private battleService: BattleService,
    private battleState: BattleStateService,
    private socketService: SocketService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
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
    this.socketConnected = this.socketService.connected;
    this.refreshSocketPlayerId();

    this.subs.add(
      this.socketService.onConnectionChange().subscribe((connected) => {
        this.socketConnected = connected;
        if (connected) {
          this.refreshSocketPlayerId();
        }
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.socketService.onGameEvent().subscribe((event) => {
        if (isGameEventEnvelope(event)) {
          return;
        }
        void this.handleGameEvent(event);
      })
    );

    this.subs.add(
      this.socketService.onPlayerJoined().subscribe((playerId) => {
        const socketId = this.socketService.getSocketId();
        if (socketId) {
          this.battleState.addPlayer(socketId);
        }
        this.battleState.addPlayer(playerId);
        this.updateWaitingMessage();
        void this.tryEnterTeamSelect();
      })
    );

    this.subs.add(
      this.socketService.onPlayerLeft().subscribe((playerId) => {
        if (playerId === '__room_closed__') {
          this.resetMatchState();
          return;
        }
        this.battleState.removePlayer(playerId);
        this.opponentSelectionConfirmed = false;
        this.updateWaitingMessage();
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

  get allPlayersConnected(): boolean {
    return this.battleState.hasEnoughPlayers();
  }

  get waitingForOpponent(): boolean {
    return this.localSelectionConfirmed && !this.opponentSelectionConfirmed;
  }

  applyBattleServerUrl(): void {
    this.createRoomError = '';
    this.socketService.setServerUrl(this.battleServerUrl);
    this.battleServerUrl = this.socketService.getServerUrl();
    this.socketConnected = this.socketService.connected;
    this.refreshSocketPlayerId();
    this.cdr.markForCheck();
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
    this.createRoomError = '';
    if (!this.battleConfigForm.valid) {
      this.battleConfigForm.markAllAsTouched();
      this.createRoomError = 'Complete all battle settings before creating a room.';
      return;
    }

    this.creatingRoom = true;
    try {
      this.battleKey = await this.socketService.createGame();
      this.refreshSocketPlayerId();
      const socketId = this.socketService.getSocketId();
      if (socketId) {
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
      this.updateWaitingMessage();
    } catch (err) {
      this.createRoomError =
        err instanceof Error
          ? err.message
          : 'Failed to create room. Check that the battle server is running.';
    } finally {
      this.creatingRoom = false;
      this.cdr.markForCheck();
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

      if (response.readyForTeamSelect) {
        void this.enterTeamSelect();
      } else {
        this.currentStep = 4;
        this.updateWaitingMessage();
      }
    });
  }

  selectTeamPokemon(index: number): void {
    if (this.localSelectionConfirmed) {
      return;
    }
    this.selectedTeamIndex = index;
    const config = this.battleState.config;
    const pokemon = this.teamOptions[index];
    if (config && pokemon) {
      const preview = this.battleService.createBattler(pokemon, config.level);
      this.battleState.setPlayerActive(preview);
    }
  }

  confirmTeamSelection(): void {
    if (
      this.selectedTeamIndex === null ||
      !this.battleState.config ||
      this.localSelectionConfirmed
    ) {
      return;
    }

    const pokemon = this.teamOptions[this.selectedTeamIndex]!;
    const battler = this.battleService.createBattler(
      pokemon,
      this.battleState.config.level
    );

    this.localSelectionConfirmed = true;
    this.battleState.setPlayerActive(battler);
    this.battleState.patchField({
      message: `${battler.displayName} is ready! Waiting for opponent…`,
    });

    this.socketService.sendGameEvent(this.battleKey, {
      type: 'teamSelect',
      battler,
    });

    this.tryBeginBattle();
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

  private async handleGameEvent(event: BattleGameEvent): Promise<void> {
    if (event.type === 'allPlayersConnected') {
      if (event.users) {
        this.battleState.setPlayerIds(event.users);
      }
      await this.enterTeamSelect();
      return;
    }

    if (event.type === 'teamSelect' && event.senderId !== this.socketService.getSocketId()) {
      if (event.battler) {
        this.battleState.setOpponentActive(event.battler);
        this.opponentSelectionConfirmed = true;
        this.tryBeginBattle();
      }
      return;
    }

    if (event.senderId === this.socketService.getSocketId()) {
      if (event.type === 'battleConfig') {
        this.currentStep = 3;
      }
      return;
    }

    this.battleState.handleRemoteEvent(event, event.senderId ?? null);

    if (event.type === 'battleConfig' && event.config) {
      this.currentStep = 4;
      this.updateWaitingMessage();
    }
  }

  private async tryEnterTeamSelect(): Promise<void> {
    if (this.allPlayersConnected && this.battleState.config) {
      await this.enterTeamSelect();
    }
  }

  private async enterTeamSelect(): Promise<void> {
    if (this.teamSelectEntered || !this.battleState.config) {
      return;
    }
    this.teamSelectEntered = true;
    this.teamSelectLoading = true;
    this.currentStep = 7;
    this.battleState.enterTeamSelectPhase();

    this.teamOptions = await this.battleService.buildTeam(this.battleState.config);
    this.teamSelectLoading = false;

    if (this.teamOptions.length > 0) {
      this.selectTeamPokemon(0);
    }
  }

  private tryBeginBattle(): void {
    if (!this.localSelectionConfirmed || !this.opponentSelectionConfirmed) {
      return;
    }

    const ally = this.battleState.field.playerActive;
    const foe = this.battleState.field.opponentActive;
    if (!ally || !foe) {
      return;
    }

    const message = `BATTLE START! Go, ${ally.displayName}!`;
    this.battleState.startBattleLocally(message);
    this.currentStep = 6;
    this.broadcastFieldState(message);
  }

  private updateWaitingMessage(): void {
    const connected = this.battleState.playerIds.length;
    const required = this.requiredPlayers;
    this.battleState.patchField({
      message:
        connected < required
          ? `Waiting for players… (${connected}/${required})`
          : 'All players connected!',
    });
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
        opponentActive: field.opponentActive,
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

  private refreshSocketPlayerId(): void {
    const socketId = this.socketService.getSocketId();
    if (socketId) {
      this.battleState.setLocalPlayerId(socketId);
    }
  }

  private resetMatchState(): void {
    this.battleState.reset();
    this.currentStep = 1;
    this.mode = 'choose';
    this.teamOptions = [];
    this.selectedTeamIndex = null;
    this.localSelectionConfirmed = false;
    this.opponentSelectionConfirmed = false;
    this.teamSelectEntered = false;
    this.teamSelectLoading = false;
    this.createRoomError = '';
    this.creatingRoom = false;
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
