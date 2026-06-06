import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { Item } from 'src/app/interfaces/item';
import { BattleConfigEventPayload } from 'src/app/interfaces/battle-event';
import { MovesCatalog } from 'src/app/interfaces/move';
import { BattleSessionService } from 'src/app/services/battle/battle-session.service';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { Subscription, distinctUntilChanged, firstValueFrom } from 'rxjs';

export type BattleWorkspaceStep = 'room' | 'team';

@Component({
  selector: 'app-battle-workspace',
  templateUrl: './battle-workspace.component.html',
  styleUrls: ['./battle-workspace.component.css'],
  standalone: false,
})
export class BattleWorkspaceComponent implements OnInit, OnDestroy {
  readonly levelOptions = Array.from({ length: 100 }, (_, i) => i + 1);
  readonly generationOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  roomMode: 'choose' | 'create' | 'join' = 'choose';
  joinRoomKey = '';
  joinError = '';
  createError = '';
  workspaceStep: BattleWorkspaceStep = 'room';
  battleServerUrl = '';
  socketConnected = false;
  creatingRoom = false;
  joiningRoom = false;
  inviteUrl = '';

  battleConfigForm: FormGroup;
  movesCatalog: MovesCatalog | null = null;
  pokedexSlice: Pokemon[] = [];
  itemChoices: Item[] = [];

  private subs = new Subscription();
  private autoJoinAttempted = false;

  constructor(
    public session: BattleSessionService,
    private pokemonService: PokemonService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.battleConfigForm = this.fb.group({
      level: [50, [Validators.required]],
      generation: [null as number | null],
      useItems: [false],
    });
  }

  ngOnInit(): void {
    this.battleServerUrl = this.session.getServerUrl();
    this.socketConnected = this.session.connected;

    this.subs.add(
      this.session.onConnectionChange().subscribe((connected) => {
        this.socketConnected = connected;
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.session.phase$.pipe(distinctUntilChanged()).subscribe((phase) => {
        if (phase === 'setupTeam') {
          this.workspaceStep = 'team';
          this.cdr.markForCheck();
        }
      })
    );

    this.subs.add(
      this.session.roomKey$.subscribe((key) => {
        if (key) {
          this.inviteUrl = this.session.buildInviteUrl(
            key,
            this.session.getServerUrl()
          );
          this.cdr.markForCheck();
        }
      })
    );

    this.subs.add(
      this.session.readyPlayerIds$.subscribe(() => this.cdr.markForCheck())
    );
    this.subs.add(
      this.session.countdownSeconds$.subscribe(() => this.cdr.markForCheck())
    );

    firstValueFrom(this.pokemonService.getMovesCatalog()).then((c) => {
      this.movesCatalog = c;
    });
    this.pokemonService.getPokedex().subscribe((list) => {
      this.pokedexSlice = list.slice(0, 200);
    });
    this.session.loadRandomItemsForPicker().then((items) => {
      this.itemChoices = items;
    });

    this.tryAutoJoinFromUrl();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.session.reset();
  }

  get playerCount(): number {
    return this.session.playerCount$.value;
  }

  get maxPlayers(): number {
    return this.session.maxPlayers$.value;
  }

  get allPlayersConnected(): boolean {
    return (
      this.playerCount >= this.maxPlayers &&
      this.maxPlayers > 0 &&
      !!this.session.roomKey$.value
    );
  }

  get readyCount(): number {
    return this.session.readyPlayerIds$.value.length;
  }

  get showReadyPanel(): boolean {
    return this.allPlayersConnected && !this.session.matchStarted$.value;
  }

  markReady(): void {
    this.session.setReady();
    this.cdr.markForCheck();
  }

  applyServerUrl(): void {
    this.createError = '';
    this.joinError = '';
    this.session.applyServerUrl(this.battleServerUrl);
    this.battleServerUrl = this.session.getServerUrl();
    this.socketConnected = this.session.connected;
    this.cdr.markForCheck();
  }

  selectCreate(): void {
    if (!this.socketConnected) {
      this.createError = 'Connect to the battle server first.';
      return;
    }
    this.roomMode = 'create';
    this.createError = '';
  }

  selectJoin(): void {
    if (!this.socketConnected) {
      this.joinError = 'Connect to the battle server first.';
      return;
    }
    this.roomMode = 'join';
    this.joinError = '';
  }

  backToChoose(): void {
    this.roomMode = 'choose';
    this.joinError = '';
    this.createError = '';
  }

  async submitCreateRoom(): Promise<void> {
    this.createError = '';
    if (!this.battleConfigForm.valid) {
      this.battleConfigForm.markAllAsTouched();
      return;
    }
    if (!this.socketConnected) {
      this.createError = 'Connect to the battle server before creating a room.';
      return;
    }

    this.creatingRoom = true;
    const v = this.battleConfigForm.value;
    const payload: BattleConfigEventPayload = {
      level: v.level,
      generation: v.generation,
      useItems: v.useItems,
      itemQuantity: v.useItems ? 6 : 0,
      maxPlayers: 2,
      teamSize: 6,
      format: 'singles',
    };

    try {
      const key = await this.session.createRoomAndPublishConfig(payload);
      this.joinRoomKey = key;
      this.inviteUrl = this.session.buildInviteUrl(
        key,
        this.session.getServerUrl()
      );
    } catch (err) {
      this.createError =
        err instanceof Error ? err.message : 'Could not create battle room.';
    } finally {
      this.creatingRoom = false;
      this.cdr.markForCheck();
    }
  }

  async tryJoin(): Promise<void> {
    this.joinError = '';
    const key = this.joinRoomKey.trim();
    if (!key) {
      this.joinError = 'Enter a room code.';
      return;
    }
    if (!this.socketConnected) {
      this.joinError = 'Connect to the battle server before joining.';
      return;
    }

    this.joiningRoom = true;
    try {
      await this.session.joinRoom(key);
      this.joinRoomKey = key;
    } catch (err) {
      this.joinError = err instanceof Error ? err.message : 'Join failed.';
    } finally {
      this.joiningRoom = false;
      this.cdr.markForCheck();
    }
  }

  copyInvite(): void {
    if (!this.inviteUrl) {
      return;
    }
    navigator.clipboard.writeText(this.inviteUrl).catch(() => undefined);
  }

  copyRoomCode(): void {
    const key = this.session.roomKey$.value;
    if (!key) {
      return;
    }
    navigator.clipboard.writeText(key).catch(() => undefined);
  }

  goStep(step: BattleWorkspaceStep): void {
    if (step === 'team' && !this.session.matchStarted$.value) {
      return;
    }
    this.workspaceStep = step;
  }

  isPokemonSelected(p: Pokemon): boolean {
    return this.session.selectedTeam$.value.some(
      (x) => String(x.id) === String(p.id)
    );
  }

  togglePokemon(p: Pokemon): void {
    this.session.toggleTeamMember(p);
  }

  private tryAutoJoinFromUrl(): void {
    const join = this.route.snapshot.queryParamMap.get('join')?.trim();
    const socketUrl = this.route.snapshot.queryParamMap.get('socketUrl')?.trim();
    if (socketUrl) {
      this.battleServerUrl = socketUrl;
      this.session.applyServerUrl(socketUrl);
      this.socketConnected = this.session.connected;
    }
    if (!join) {
      return;
    }
    this.joinRoomKey = join;
    this.roomMode = 'join';

    const attemptJoin = () => {
      if (this.autoJoinAttempted || !this.socketConnected) {
        return;
      }
      this.autoJoinAttempted = true;
      void this.tryJoin();
    };

    if (this.socketConnected) {
      attemptJoin();
    } else {
      this.subs.add(
        this.session.onConnectionChange().subscribe((connected) => {
          this.socketConnected = connected;
          attemptJoin();
        })
      );
    }
  }
}
