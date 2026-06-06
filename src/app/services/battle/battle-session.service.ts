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
  GameEventEnvelope,
  isGameEventEnvelope,
} from 'src/app/interfaces/battle-event';
import { JoinRoomResponse } from 'src/app/interfaces/battle';
import { SocketService } from '../socket/socket.service';
import { PokemonService } from '../pokemon/pokemon.service';
import { ItemService } from '../items/item.service';
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
  | 'active';

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

  private gameEventSub: Subscription | null = null;
  private playerJoinedSub: Subscription | null = null;
  private playerLeftSub: Subscription | null = null;

  readonly playerStage$: Observable<BattleStagePokemon | null> = combineLatest([
    this.selectedTeam$,
    this.battleConfig$,
  ]).pipe(
    map(([team, cfg]) => {
      const lead = team[0];
      if (!lead) {
        return null;
      }
      return this.toStagePokemon(lead, cfg?.level ?? 50);
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
    private readonly itemService: ItemService
  ) {
    this.playerJoinedSub = this.socket.onPlayerJoined().subscribe(() => {
      this.syncPlayerCountFromRoom();
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

    this.pokemonService.getPokemonByName('pidgey').subscribe((poke) => {
      if (poke) {
        this.opponentPreview$.next(this.toStagePokemon(poke, 17));
      }
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
    return new Promise((resolve, reject) => {
      this.socket.joinRoom(roomKey, (response: JoinRoomResponse) => {
        if (response.error) {
          reject(new Error(response.error));
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
    });
  }

  toggleTeamMember(pokemon: Pokemon): void {
    if (!this.matchStarted$.value) {
      return;
    }
    const cur = [...this.selectedTeam$.value];
    const idx = cur.findIndex((p) => String(p.id) === String(pokemon.id));
    if (idx >= 0) {
      cur.splice(idx, 1);
    } else if (cur.length < 6) {
      cur.push(pokemon);
    }
    this.selectedTeam$.next(cur);
  }

  setMovesForPokemon(pokemonId: string, moveIds: number[]): void {
    const next = { ...this.selectedMovesByPokemon$.value };
    next[pokemonId] = moveIds.slice(0, 4);
    this.selectedMovesByPokemon$.next(next);
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

  private applyJoinSnapshot(
    response: JoinRoomResponse,
    role: BattleRole
  ): void {
    this.role$.next(role);
    if (response.roomKey) {
      this.roomKey$.next(response.roomKey);
    }
    if (response.users) {
      this.playerCount$.next(response.users.length);
    } else if (response.playerCount != null) {
      this.playerCount$.next(response.playerCount);
    }
    if (response.maxPlayers != null) {
      this.maxPlayers$.next(response.maxPlayers);
    }
    if (response.battleConfig) {
      this.battleConfig$.next(this.mapServerConfig(response.battleConfig));
    }
    this.applyReadySnapshot(response);
  }

  private syncPlayerCountFromRoom(): void {
    const key = this.roomKey$.value;
    if (!key) {
      return;
    }
    this.socket.joinRoom(key, (response: JoinRoomResponse) => {
      if (response.success) {
        if (response.users) {
          this.playerCount$.next(response.users.length);
        }
        if (response.maxPlayers != null) {
          this.maxPlayers$.next(response.maxPlayers);
        }
        if (response.matchStarted || response.readyForTeamSelect) {
          this.applyMatchStarted();
        } else {
          this.applyReadySnapshot(response);
        }
      }
    });
  }

  private handleGameEvent(event: unknown): void {
    if (!isGameEventEnvelope(event)) {
      return;
    }

    if (event.type === 'battle:config') {
      this.battleConfig$.next(event.payload as BattleConfigEventPayload);
      if (this.maxPlayers$.value < 1) {
        this.maxPlayers$.next(
          (event.payload as BattleConfigEventPayload).maxPlayers ?? 2
        );
      }
      return;
    }

    if (event.type === 'battle:readyState') {
      const payload = event.payload as BattleReadyStatePayload;
      this.readyPlayerIds$.next(payload.readyPlayerIds ?? []);
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
      generation: config.generation,
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
