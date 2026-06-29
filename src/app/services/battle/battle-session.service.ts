import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  map,
} from 'rxjs';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { Item } from 'src/app/interfaces/item';
import {
  BattleConfigEventPayload,
  BattleCountdownPayload,
  BattleReadyStatePayload,
  BattleStateUpdatePayload,
  BattleActiveView,
  BattleCombatMove,
  GameEventEnvelope,
  isGameEventEnvelope,
} from 'src/app/interfaces/battle-event';
import { JoinRoomResponse } from 'src/app/interfaces/battle';
import { SocketService } from '../socket/socket.service';
import { PokemonService } from '../pokemon/pokemon.service';
import { ItemService } from '../items/item.service';
import { BattleService } from './battle.service';
import { firstValueFrom } from 'rxjs';

export type BattleRole = 'host' | 'guest' | null;

export type BattleWorkspacePhase =
  | 'idle'
  | 'lobby'
  | 'awaitingPlayers'
  | 'readyQueue'
  | 'countdown'
  | 'setupTeam'
  | 'setupMoves'
  | 'setupItems'
  | 'active'
  | 'finished';

export interface BattleStagePokemon {
  name: string;
  level: number;
  spriteFront: string | null;
  spriteBack: string | null;
  currentHp: number;
  maxHp: number;
}

@Injectable({
  providedIn: 'root',
})
export class BattleSessionService {
  readonly phase$ = new BehaviorSubject<BattleWorkspacePhase>('idle');
  readonly role$ = new BehaviorSubject<BattleRole>(null);
  readonly roomKey$ = new BehaviorSubject<string>('');
  readonly playerCount$ = new BehaviorSubject<number>(0);
  readonly maxPlayers$ = new BehaviorSubject<number>(2);
  readonly matchStarted$ = new BehaviorSubject<boolean>(false);
  readonly readyPlayerIds$ = new BehaviorSubject<string[]>([]);
  readonly countdownSeconds$ = new BehaviorSubject<number | null>(null);

  readonly battleConfig$ = new BehaviorSubject<BattleConfigEventPayload | null>(
    null
  );

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  readonly selectedTeam$ = new BehaviorSubject<Pokemon[]>([]);
  readonly selectedItems$ = new BehaviorSubject<Item[]>([]);
  readonly selectedMovesByPokemon$ = new BehaviorSubject<
    Record<string, number[]>
  >({});

  readonly opponentPreview$ = new BehaviorSubject<BattleStagePokemon | null>(
    null
  );

  readonly combatState$ = new BehaviorSubject<BattleStateUpdatePayload | null>(
    null
  );
  readonly teamLocked$ = new BehaviorSubject<boolean>(false);
  readonly availableMoves$ = new BehaviorSubject<BattleCombatMove[]>([]);

  private gameEventSub: Subscription | null = null;
  private playerJoinedSub: Subscription | null = null;
  private playerLeftSub: Subscription | null = null;

  readonly playerStage$: Observable<BattleStagePokemon | null> = combineLatest([
    this.combatState$,
    this.selectedTeam$,
    this.battleConfig$,
  ]).pipe(
    map(([combat, team, cfg]) => {
      const self = this.getSelfActive(combat);
      if (self) {
        return this.activeToStage(self);
      }
      const lead = team[0];
      if (!lead) {
        return null;
      }
      return this.toStagePokemon(lead, cfg?.level ?? 50);
    })
  );

  readonly opponentStage$: Observable<BattleStagePokemon | null> =
    this.combatState$.pipe(
      map((combat) => {
        const foe = this.getOpponentActive(combat);
        return foe ? this.activeToStage(foe) : null;
      })
    );

  readonly allPlayersConnected$: Observable<boolean> = combineLatest([
    this.playerCount$,
    this.maxPlayers$,
  ]).pipe(map(([count, max]) => count >= max && max > 0));

  readonly localPlayerReady$: Observable<boolean> = this.readyPlayerIds$.pipe(
    map((readyIds) => {
      const id = this.socket.getSocketId();
      return !!id && readyIds.includes(id);
    })
  );

  constructor(
    private readonly socket: SocketService,
    private readonly pokemonService: PokemonService,
    private readonly itemService: ItemService,
    private readonly battleService: BattleService
  ) {
    this.playerJoinedSub = this.socket.onPlayerJoined().subscribe(() => {
      this.syncPlayerCountFromRoom();
    });

    this.socket.onConnectionChange().subscribe((connected) => {
      if (connected) {
        this.rejoinRoomIfNeeded();
      }
    });

    this.playerLeftSub = this.socket.onPlayerLeft().subscribe((id) => {
      if (id === '__room_closed__') {
        this.reset();
        return;
      }
      this.syncPlayerCountFromRoom();
      if (this.matchStarted$.value) {
        return;
      }
      this.clearCountdownTimer();
      this.countdownSeconds$.next(null);
      if (this.playerCount$.value < this.maxPlayers$.value) {
        this.phase$.next('awaitingPlayers');
      }
    });

    this.gameEventSub = this.socket.onGameEvent().subscribe((event) => {
      this.handleGameEvent(event);
    });
  }

  get connected(): boolean {
    return this.socket.connected;
  }

  onConnectionChange(): Observable<boolean> {
    return this.socket.onConnectionChange();
  }

  getServerUrl(): string {
    return this.socket.getServerUrl();
  }

  applyServerUrl(url: string): void {
    this.socket.setServerUrl(url);
  }

  buildInviteUrl(roomKey: string, socketUrl: string): string {
    if (typeof window === 'undefined') {
      return `/battle?join=${roomKey}`;
    }
    const params = new URLSearchParams();
    params.set('join', roomKey);
    params.set('socketUrl', socketUrl);
    return `${window.location.origin}/battle?${params.toString()}`;
  }

  reset(): void {
    this.clearCountdownTimer();
    this.phase$.next('idle');
    this.role$.next(null);
    this.roomKey$.next('');
    this.playerCount$.next(0);
    this.maxPlayers$.next(2);
    this.matchStarted$.next(false);
    this.readyPlayerIds$.next([]);
    this.countdownSeconds$.next(null);
    this.battleConfig$.next(null);
    this.selectedTeam$.next([]);
    this.selectedItems$.next([]);
    this.selectedMovesByPokemon$.next({});
    this.combatState$.next(null);
    this.teamLocked$.next(false);
    this.availableMoves$.next([]);
    this.opponentPreview$.next(null);
  }

  setReady(): void {
    const roomKey = this.roomKey$.value;
    if (!roomKey || this.matchStarted$.value) {
      return;
    }
    const envelope: GameEventEnvelope = {
      type: 'battle:ready',
      version: 1,
      payload: {},
    };
    this.socket.sendGameEvent(roomKey, envelope);
  }

  getLocalSocketId(): string | undefined {
    return this.socket.getSocketId();
  }

  isLocalReady(): boolean {
    const id = this.socket.getSocketId();
    return !!id && this.readyPlayerIds$.value.includes(id);
  }

  async waitForServer(): Promise<void> {
    await this.socket.waitUntilConnected();
  }

  async createRoomAndPublishConfig(
    config: BattleConfigEventPayload
  ): Promise<string> {
    await this.waitForServer();

    const payload: BattleConfigEventPayload = {
      ...config,
      maxPlayers: config.maxPlayers ?? 2,
      teamSize: config.teamSize ?? 6,
      format: config.format ?? 'singles',
    };

    const roomKey = await this.socket.createGame();
    await new Promise<void>((resolve, reject) => {
      this.socket.joinRoom(roomKey, (response: JoinRoomResponse) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        this.applyJoinSnapshot(response, 'host');
        resolve();
      });
    });

    const envelope: GameEventEnvelope = {
      type: 'battle:config',
      version: 1,
      payload,
    };
    this.socket.sendGameEvent(roomKey, envelope);
    this.battleConfig$.next(payload);
    this.phase$.next('awaitingPlayers');
    return roomKey;
  }

  joinRoom(roomKey: string): Promise<void> {
    const trimmed = roomKey.trim();
    if (!trimmed) {
      return Promise.reject(new Error('Enter a room code.'));
    }

    return this.waitForServer().then(
      () =>
        new Promise<void>((resolve, reject) => {
          this.socket.joinRoom(trimmed, (response: JoinRoomResponse) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }
            if (!response.success && !response.roomKey) {
              reject(new Error('Could not join room.'));
              return;
            }
            this.applyJoinSnapshot(response, 'guest');
            if (response.matchStarted || response.readyForTeamSelect) {
              this.applyMatchStarted();
            } else {
              this.applyReadySnapshot(response);
            }
            resolve();
          });
        })
    );
  }

  toggleTeamMember(pokemon: Pokemon): void {
    if (!this.matchStarted$.value || this.teamLocked$.value) {
      return;
    }
    const maxTeam = this.battleConfig$.value?.teamSize ?? 6;
    const cur = [...this.selectedTeam$.value];
    const idx = cur.findIndex((p) => String(p.id) === String(pokemon.id));
    if (idx >= 0) {
      cur.splice(idx, 1);
      const moves = { ...this.selectedMovesByPokemon$.value };
      delete moves[String(pokemon.id)];
      this.selectedMovesByPokemon$.next(moves);
    } else if (cur.length < maxTeam) {
      cur.push(pokemon);
    }
    this.selectedTeam$.next(cur);
  }

  setMovesForPokemon(pokemonId: string, moveIds: number[]): void {
    const next = { ...this.selectedMovesByPokemon$.value };
    next[pokemonId] = moveIds.slice(0, 4);
    this.selectedMovesByPokemon$.next(next);
  }

  toggleMoveForPokemon(pokemonId: string, moveId: number): void {
    if (this.teamLocked$.value) {
      return;
    }
    const cur = [...(this.selectedMovesByPokemon$.value[pokemonId] ?? [])];
    const idx = cur.indexOf(moveId);
    if (idx >= 0) {
      cur.splice(idx, 1);
    } else if (cur.length < 4) {
      cur.push(moveId);
    }
    this.setMovesForPokemon(pokemonId, cur);
  }

  proceedToMoveSetup(): void {
    if (!this.matchStarted$.value || this.teamLocked$.value) {
      return;
    }
    const team = this.selectedTeam$.value;
    const teamSize = this.battleConfig$.value?.teamSize ?? 6;
    if (team.length < 1 || team.length > teamSize) {
      return;
    }
    this.phase$.next('setupMoves');
  }

  allTeamMovesConfigured(): boolean {
    const team = this.selectedTeam$.value;
    if (team.length === 0) {
      return false;
    }
    const movesByPokemon = this.selectedMovesByPokemon$.value;
    return team.every(
      (p) => (movesByPokemon[String(p.id)]?.length ?? 0) === 4
    );
  }

  canProceedToMoveSetup(): boolean {
    const team = this.selectedTeam$.value;
    const teamSize = this.battleConfig$.value?.teamSize ?? 6;
    return (
      !this.teamLocked$.value &&
      this.matchStarted$.value &&
      team.length >= 1 &&
      team.length <= teamSize
    );
  }

  toggleItem(item: Item): void {
    const cur = [...this.selectedItems$.value];
    const idx = cur.findIndex((i) => i.name === item.name);
    if (idx >= 0) {
      cur.splice(idx, 1);
    } else if (cur.length < 6) {
      cur.push(item);
    }
    this.selectedItems$.next(cur);
  }

  async loadRandomItemsForPicker(): Promise<Item[]> {
    return firstValueFrom(this.itemService.getRandomItems());
  }

  async confirmTeam(): Promise<void> {
    const roomKey = this.roomKey$.value;
    const team = this.selectedTeam$.value;
    const level = this.battleConfig$.value?.level ?? 50;
    const teamSize = this.battleConfig$.value?.teamSize ?? 6;

    if (!roomKey) {
      throw new Error('No active room.');
    }
    if (!this.matchStarted$.value) {
      throw new Error('Wait for the match countdown to finish.');
    }
    if (team.length < 1 || team.length > teamSize) {
      throw new Error(`Pick between 1 and ${teamSize} Pokémon.`);
    }
    if (this.teamLocked$.value) {
      return;
    }
    if (!this.allTeamMovesConfigured()) {
      throw new Error('Choose exactly 4 moves for each Pokémon on your team.');
    }

    const battlers = await this.battleService.buildCombatTeam(
      team,
      level,
      this.selectedMovesByPokemon$.value
    );
    if (!this.connected) {
      throw new Error('Not connected to the battle server.');
    }
    const envelope: GameEventEnvelope = {
      type: 'battle:teamLock',
      version: 1,
      payload: { battlers },
    };
    this.socket.sendGameEvent(roomKey, envelope);
    this.teamLocked$.next(true);
  }

  submitMove(moveId: number): void {
    const roomKey = this.roomKey$.value;
    const combat = this.combatState$.value;
    const selfId = this.socket.getSocketId();
    if (!roomKey || !combat || !selfId) {
      return;
    }
    if (!combat.awaitingMoves.includes(selfId)) {
      return;
    }

    const envelope: GameEventEnvelope = {
      type: 'battle:turn',
      version: 1,
      payload: {
        actorId: selfId,
        moveId,
        targetSlot: 0,
        turnNumber: combat.turn,
      },
    };
    this.socket.sendGameEvent(roomKey, envelope);
  }

  forfeitMatch(): void {
    const roomKey = this.roomKey$.value;
    if (!roomKey || this.combatState$.value?.winnerId) {
      return;
    }

    const envelope: GameEventEnvelope = {
      type: 'battle:forfeit',
      version: 1,
      payload: {},
    };
    this.socket.sendGameEvent(roomKey, envelope);
  }

  getActivePokemonName(): string {
    const combat = this.combatState$.value;
    const selfId = this.socket.getSocketId();
    if (!combat || !selfId) {
      return 'your Pokémon';
    }
    const active = combat.actives[selfId];
    if (!active) {
      return 'your Pokémon';
    }
    return active.displayName || active.name;
  }

  isAwaitingLocalMove(): boolean {
    const selfId = this.socket.getSocketId();
    const combat = this.combatState$.value;
    return !!selfId && !!combat?.awaitingMoves.includes(selfId);
  }

  getOpponentId(): string | null {
    const combat = this.combatState$.value;
    const selfId = this.socket.getSocketId();
    if (!combat || !selfId) {
      return null;
    }
    return Object.keys(combat.actives).find((id) => id !== selfId) ?? null;
  }

  private getSelfActive(
    combat: BattleStateUpdatePayload | null
  ): BattleActiveView | null {
    const selfId = this.socket.getSocketId();
    if (!combat || !selfId) {
      return null;
    }
    return combat.actives[selfId] ?? null;
  }

  private getOpponentActive(
    combat: BattleStateUpdatePayload | null
  ): BattleActiveView | null {
    const selfId = this.socket.getSocketId();
    if (!combat || !selfId) {
      return null;
    }
    const opponentId = Object.keys(combat.actives).find((id) => id !== selfId);
    if (!opponentId) {
      return null;
    }
    return combat.actives[opponentId] ?? null;
  }

  private activeToStage(active: BattleActiveView): BattleStagePokemon {
    return {
      name: active.name,
      level: active.level,
      spriteFront: active.frontSprite,
      spriteBack: active.backSprite,
      currentHp: active.currentHp,
      maxHp: active.maxHp,
    };
  }

  private applyCombatState(payload: BattleStateUpdatePayload): void {
    this.combatState$.next(payload);

    const selfId = this.socket.getSocketId();
    if (selfId && payload.lockedPlayers.includes(selfId)) {
      this.teamLocked$.next(true);
    }

    const foe = this.getOpponentActive(payload);
    if (foe) {
      this.opponentPreview$.next(this.activeToStage(foe));
    }

    if (payload.winnerId) {
      this.phase$.next('finished');
      return;
    }

    if (this.isBattleLive(payload)) {
      this.phase$.next('active');
      this.refreshAvailableMoves(payload);
    }
  }

  private isBattleLive(payload: BattleStateUpdatePayload): boolean {
    if (payload.battleStarted) {
      return true;
    }
    if (payload.awaitingMoves.length > 0) {
      return true;
    }
    const activeCount = Object.values(payload.actives).filter(Boolean).length;
    const playersNeeded = Math.max(this.maxPlayers$.value, 2);
    return payload.turn >= 1 && activeCount >= playersNeeded;
  }

  private refreshAvailableMoves(payload: BattleStateUpdatePayload): void {
    const selfId = this.socket.getSocketId();
    if (!selfId || !payload.awaitingMoves.includes(selfId)) {
      this.availableMoves$.next([]);
      return;
    }

    const selfActive = payload.actives[selfId];
    if (!selfActive?.moves?.length) {
      this.availableMoves$.next([]);
      return;
    }

    this.availableMoves$.next(selfActive.moves);
  }

  private rejoinRoomIfNeeded(): void {
    const key = this.roomKey$.value;
    if (!key) {
      return;
    }
    this.socket.joinRoom(key, (response: JoinRoomResponse) => {
      if (response.error) {
        return;
      }
      this.updateRoomSnapshot(response);
      if (response.matchStarted || response.readyForTeamSelect) {
        this.applyMatchStarted();
      }
    });
  }

  private applyJoinSnapshot(
    response: JoinRoomResponse,
    role: BattleRole
  ): void {
    this.role$.next(role);
    if (response.roomKey) {
      this.roomKey$.next(response.roomKey);
    }
    this.updateRoomSnapshot(response);
    this.applyReadySnapshot(response);
  }

  private syncPlayerCountFromRoom(): void {
    const key = this.roomKey$.value;
    if (!key) {
      return;
    }
    this.socket.joinRoom(key, (response: JoinRoomResponse) => {
      if (response.error) {
        return;
      }
      this.updateRoomSnapshot(response);
      if (response.matchStarted || response.readyForTeamSelect) {
        this.applyMatchStarted();
      } else {
        this.applyReadySnapshot(response);
      }
    });
  }

  private updateRoomSnapshot(response: JoinRoomResponse): void {
    if (response.users?.length) {
      this.playerCount$.next(response.users.length);
    } else if (response.playerCount != null) {
      this.playerCount$.next(response.playerCount);
    } else if (response.success) {
      this.playerCount$.next(Math.max(1, this.playerCount$.value));
    }
    if (response.maxPlayers != null) {
      this.maxPlayers$.next(response.maxPlayers);
    }
    if (response.battleConfig) {
      this.battleConfig$.next(this.mapServerConfig(response.battleConfig));
    }
  }

  private handleGameEvent(event: unknown): void {
    if (!isGameEventEnvelope(event)) {
      return;
    }

    if (event.type === 'battle:config') {
      this.battleConfig$.next(event.payload as BattleConfigEventPayload);
      const cfg = event.payload as BattleConfigEventPayload;
      if (cfg.maxPlayers != null) {
        this.maxPlayers$.next(cfg.maxPlayers);
      }
      return;
    }

    if (event.type === 'battle:readyState') {
      const payload = event.payload as BattleReadyStatePayload;
      this.readyPlayerIds$.next(payload.readyPlayerIds ?? []);
      if (payload.playerCount != null) {
        this.playerCount$.next(payload.playerCount);
      }
      if (payload.maxPlayers != null) {
        this.maxPlayers$.next(payload.maxPlayers);
      }
      if (this.allPlayersConnectedFromState() && !this.matchStarted$.value) {
        this.phase$.next('readyQueue');
      }
      return;
    }

    if (event.type === 'battle:countdown') {
      const payload = event.payload as BattleCountdownPayload;
      this.phase$.next('countdown');
      this.startCountdownFromEndsAt(payload.endsAt);
      return;
    }

    if (event.type === 'battle:matchStart') {
      this.clearCountdownTimer();
      this.countdownSeconds$.next(null);
      this.applyMatchStarted();
      return;
    }

    if (event.type === 'battle:stateUpdate') {
      this.applyCombatState(event.payload as BattleStateUpdatePayload);
    }
  }

  private allPlayersConnectedFromState(): boolean {
    return (
      this.playerCount$.value >= this.maxPlayers$.value &&
      this.maxPlayers$.value > 0
    );
  }

  private applyReadySnapshot(response: JoinRoomResponse): void {
    if (response.readyPlayerIds) {
      this.readyPlayerIds$.next([...response.readyPlayerIds]);
    }
    if (response.countdownEndsAt) {
      this.phase$.next('countdown');
      this.startCountdownFromEndsAt(response.countdownEndsAt);
      return;
    }
    if (response.matchStarted || response.readyForTeamSelect) {
      return;
    }
    if (this.allPlayersConnectedFromState() && response.battleConfig) {
      this.phase$.next('readyQueue');
    } else {
      this.phase$.next('awaitingPlayers');
    }
  }

  private startCountdownFromEndsAt(endsAt: string): void {
    this.clearCountdownTimer();
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000)
      );
      this.countdownSeconds$.next(remaining > 0 ? remaining : null);
      if (remaining <= 0) {
        this.clearCountdownTimer();
      }
    };
    tick();
    this.countdownInterval = setInterval(tick, 200);
  }

  private clearCountdownTimer(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private applyMatchStarted(): void {
    if (this.matchStarted$.value) {
      return;
    }
    this.matchStarted$.next(true);
    this.phase$.next('setupTeam');
  }

  private mapServerConfig(
    config: JoinRoomResponse['battleConfig']
  ): BattleConfigEventPayload | null {
    if (!config) {
      return null;
    }
    return {
      level: config.level,
      useItems: config.useItems,
      itemQuantity: config.itemQuantity,
      teamSize: config.teamSize,
      maxPlayers: config.maxPlayers,
      format: config.format,
    };
  }

  private toStagePokemon(pokemon: Pokemon, level: number): BattleStagePokemon {
    const hpStat =
      pokemon.stats?.find((s) => s.stat.name === 'hp')?.base_stat ?? 35;
    const maxHp = Math.max(
      20,
      Math.floor((hpStat * 2 * level) / 100) + level + 10
    );
    return {
      name: pokemon.name,
      level,
      spriteFront: pokemon.sprites?.front_default ?? null,
      spriteBack: pokemon.sprites?.back_default ?? null,
      currentHp: maxHp,
      maxHp,
    };
  }
}
