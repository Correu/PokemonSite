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
  BattleMatchStartPayload,
  GameEventEnvelope,
} from 'src/app/interfaces/battle-event';
import { SocketService } from '../socket/socket.service';
import { PokemonService } from '../pokemon/pokemon.service';
import { ItemService } from '../items/item.service';
import { firstValueFrom } from 'rxjs';

export type BattleRole = 'host' | 'guest' | null;

export type BattleWorkspacePhase =
  | 'idle'
  | 'lobby'
  | 'awaitingGuest'
  | 'awaitingMatchStart'
  | 'setupTeam'
  | 'setupMoves'
  | 'setupItems'
  | 'ready'
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
  readonly guestPresent$ = new BehaviorSubject<boolean>(false);
  readonly matchStarted$ = new BehaviorSubject<boolean>(false);

  readonly battleConfig$ = new BehaviorSubject<BattleConfigEventPayload | null>(
    null
  );

  readonly selectedTeam$ = new BehaviorSubject<Pokemon[]>([]);
  readonly selectedItems$ = new BehaviorSubject<Item[]>([]);
  /** pokemon id (string) -> up to 4 move ids */
  readonly selectedMovesByPokemon$ = new BehaviorSubject<
    Record<string, number[]>
  >({});

  readonly opponentPreview$ = new BehaviorSubject<BattleStagePokemon | null>(
    null
  );

  private gameEventSub: Subscription | null = null;
  private opponentSub: Subscription | null = null;

  readonly playerStage$: Observable<BattleStagePokemon | null> = combineLatest([
    this.selectedTeam$,
    this.battleConfig$,
  ]).pipe(
    map(([team, cfg]) => {
      const lead = team[0];
      if (!lead) return null;
      return this.toStagePokemon(lead, cfg?.level ?? 50);
    })
  );

  constructor(
    private readonly socket: SocketService,
    private readonly pokemonService: PokemonService,
    private readonly itemService: ItemService
  ) {
    this.socket.onPlayerJoined((peerId) => {
      if (this.role$.value === 'host' && peerId !== this.socket.getSocketId()) {
        this.guestPresent$.next(true);
        if (this.phase$.value === 'awaitingGuest') {
          this.phase$.next('awaitingMatchStart');
        }
      }
    });

    this.gameEventSub = this.socket.onGameEvent().subscribe((event) => {
      this.handleGameEvent(event);
    });

    this.opponentSub = this.pokemonService
      .getPokemonByName('pidgey')
      .subscribe((poke) => {
        if (poke) {
          const lvl = 17;
          this.opponentPreview$.next(this.toStagePokemon(poke, lvl));
        }
      });
  }

  reset(): void {
    this.phase$.next('idle');
    this.role$.next(null);
    this.roomKey$.next('');
    this.guestPresent$.next(false);
    this.matchStarted$.next(false);
    this.battleConfig$.next(null);
    this.selectedTeam$.next([]);
    this.selectedItems$.next([]);
    this.selectedMovesByPokemon$.next({});
  }

  async createRoomAndPublishConfig(
    config: BattleConfigEventPayload
  ): Promise<string> {
    const roomKey = await this.socket.createGame();
    this.socket.joinRoom(roomKey);
    this.role$.next('host');
    this.roomKey$.next(roomKey);
    this.battleConfig$.next(config);

    const envelope: GameEventEnvelope = {
      type: 'battle:config',
      version: 1,
      payload: config,
    };
    this.socket.sendGameEvent(roomKey, envelope);
    this.phase$.next('awaitingGuest');
    return roomKey;
  }

  joinRoom(roomKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.joinRoom(roomKey, (response) => {
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        this.role$.next('guest');
        this.roomKey$.next(roomKey);
        this.phase$.next('awaitingMatchStart');
        resolve();
      });
    });
  }

  /** Host only: broadcast match start after guest is present. */
  startMatchFromHost(): void {
    if (this.role$.value !== 'host') return;
    const roomKey = this.roomKey$.value;
    if (!roomKey || !this.guestPresent$.value) return;

    const payload: BattleMatchStartPayload = {
      roomKey,
      startedAt: new Date().toISOString(),
      hostSocketId: this.socket.getSocketId() ?? '',
    };
    const envelope: GameEventEnvelope = {
      type: 'battle:matchStart',
      version: 1,
      payload,
    };
    this.socket.sendGameEvent(roomKey, envelope);
    this.applyMatchStarted();
  }

  setTeam(team: Pokemon[]): void {
    this.selectedTeam$.next(team.slice(0, 6));
  }

  toggleTeamMember(pokemon: Pokemon): void {
    const cur = [...this.selectedTeam$.value];
    const idx = cur.findIndex((p) => p.id === pokemon.id);
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

  private handleGameEvent(event: GameEventEnvelope): void {
    if (event.type === 'battle:config') {
      this.battleConfig$.next(event.payload as BattleConfigEventPayload);
      return;
    }
    if (event.type === 'battle:matchStart') {
      this.applyMatchStarted();
    }
  }

  private applyMatchStarted(): void {
    this.matchStarted$.next(true);
    this.phase$.next('setupTeam');
  }

  private toStagePokemon(pokemon: Pokemon, level: number): BattleStagePokemon {
    const hpStat =
      pokemon.stats?.find((s) => s.stat.name === 'hp')?.base_stat ?? 35;
    const maxHp = Math.max(20, Math.floor((hpStat * 2 * level) / 100) + level + 10);
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
