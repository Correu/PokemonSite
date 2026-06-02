import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { Item } from 'src/app/interfaces/item';
import { BattleConfigEventPayload } from 'src/app/interfaces/battle-event';
import { MovesCatalog } from 'src/app/interfaces/move';
import { BattleSessionService } from 'src/app/services/battle/battle-session.service';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { distinctUntilChanged, firstValueFrom } from 'rxjs';

export type BattleWorkspaceStep = 'room' | 'team' | 'moves' | 'items';

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
  workspaceStep: BattleWorkspaceStep = 'room';

  battleConfigForm: FormGroup;
  movesCatalog: MovesCatalog | null = null;
  pokedexSlice: Pokemon[] = [];
  itemChoices: Item[] = [];

  constructor(
    public session: BattleSessionService,
    private pokemonService: PokemonService,
    private fb: FormBuilder
  ) {
    this.battleConfigForm = this.fb.group({
      level: [50, [Validators.required]],
      generation: [null as number | null],
      useItems: [false],
    });
  }

  ngOnInit(): void {
    firstValueFrom(this.pokemonService.getMovesCatalog()).then((c) => {
      this.movesCatalog = c;
    });
    this.pokemonService.getPokedex().subscribe((list) => {
      this.pokedexSlice = list.slice(0, 200);
    });
    this.session.loadRandomItemsForPicker().then((items) => {
      this.itemChoices = items;
    });

    this.session.phase$
      .pipe(distinctUntilChanged())
      .subscribe((phase) => {
        if (phase === 'setupTeam') {
          this.workspaceStep = 'team';
        }
      });
  }

  ngOnDestroy(): void {
    this.session.reset();
  }

  moveLabel(moveId: number): string {
    return this.movesCatalog?.byId[String(moveId)]?.name ?? `#${moveId}`;
  }

  pokemonKey(p: Pokemon): string {
    return String(p.id);
  }

  isPokemonSelected(p: Pokemon): boolean {
    return this.session.selectedTeam$.value.some(
      (x) => String(x.id) === String(p.id)
    );
  }

  togglePokemon(p: Pokemon): void {
    this.session.toggleTeamMember(p);
  }

  selectedMoveIds(p: Pokemon): number[] {
    return this.session.selectedMovesByPokemon$.value[this.pokemonKey(p)] ?? [];
  }

  toggleMove(p: Pokemon, moveId: number): void {
    const key = this.pokemonKey(p);
    const cur = [...(this.session.selectedMovesByPokemon$.value[key] ?? [])];
    const idx = cur.indexOf(moveId);
    if (idx >= 0) {
      cur.splice(idx, 1);
    } else if (cur.length < 4) {
      cur.push(moveId);
    }
    this.session.setMovesForPokemon(key, cur);
  }

  moveSelected(p: Pokemon, moveId: number): boolean {
    return this.selectedMoveIds(p).includes(moveId);
  }

  isItemSelected(item: Item): boolean {
    return this.session.selectedItems$.value.some((i) => i.name === item.name);
  }

  toggleItem(item: Item): void {
    this.session.toggleItem(item);
  }

  selectCreate(): void {
    this.roomMode = 'create';
  }

  selectJoin(): void {
    this.roomMode = 'join';
  }

  backToChoose(): void {
    this.roomMode = 'choose';
    this.joinError = '';
  }

  async submitCreateRoom(): Promise<void> {
    if (!this.battleConfigForm.valid) return;
    const v = this.battleConfigForm.value;
    const payload: BattleConfigEventPayload = {
      level: v.level,
      generation: v.generation,
      useItems: v.useItems,
      itemQuantity: v.useItems ? 6 : 0,
    };
    try {
      const key = await this.session.createRoomAndPublishConfig(payload);
      this.joinRoomKey = key;
    } catch {
      alert('Could not create battle room.');
    }
  }

  tryJoin(): void {
    this.joinError = '';
    const key = this.joinRoomKey.trim();
    if (!key) {
      this.joinError = 'Enter a room key.';
      return;
    }
    this.session
      .joinRoom(key)
      .then(() => {
        this.joinRoomKey = key;
      })
      .catch((e) => {
        this.joinError = e?.message ?? 'Join failed.';
      });
  }

  hostStartMatch(): void {
    this.session.startMatchFromHost();
  }

  goStep(step: BattleWorkspaceStep): void {
    if (!this.session.matchStarted$.value && step !== 'room') {
      return;
    }
    this.workspaceStep = step;
  }

  canGoTeam(): boolean {
    return this.session.matchStarted$.value;
  }

  canGoMoves(): boolean {
    return (
      this.session.matchStarted$.value &&
      this.session.selectedTeam$.value.length > 0
    );
  }

  canGoItems(): boolean {
    return this.canGoMoves();
  }
}
