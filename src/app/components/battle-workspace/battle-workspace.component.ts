import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { Item } from 'src/app/interfaces/item';
import { BattleConfigEventPayload, BattleItemType, BattleTeamMember, BattleBagSnapshot } from 'src/app/interfaces/battle-event';
import { GEN1_POKEMON_COUNT } from 'src/app/interfaces/battle';
import { BattleMove, MovesCatalog } from 'src/app/interfaces/move';
import { BattleSessionService } from 'src/app/services/battle/battle-session.service';
import { BattleService } from 'src/app/services/battle/battle.service';
import { ItemService } from 'src/app/services/items/item.service';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { Subscription, distinctUntilChanged, firstValueFrom } from 'rxjs';

export type BattleMenuPanel =
  | 'commands'
  | 'fight'
  | 'bag'
  | 'pokemon'
  | 'end-fight';

export type BattleWorkspaceStep = 'room' | 'team' | 'moves' | 'items' | 'battle';

@Component({
  selector: 'app-battle-workspace',
  templateUrl: './battle-workspace.component.html',
  styleUrls: ['./battle-workspace.component.css'],
  standalone: false,
})
export class BattleWorkspaceComponent implements OnInit, OnDestroy {
  readonly levelOptions = Array.from({ length: 100 }, (_, i) => i + 1);
  readonly teamSizeOptions = [1, 2, 3, 4, 5, 6];

  readonly itemSlotOptions = [1, 2, 3, 4, 5, 6];
  readonly itemStackOptions = [1, 2, 3, 4, 5, 10, 15, 20, 30, 50, 99];
  readonly totalPoolOptions = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 50, 99];

  roomMode: 'choose' | 'create' | 'join' = 'choose';
  joinRoomKey = '';
  joinError = '';
  createError = '';
  workspaceStep: BattleWorkspaceStep = 'room';
  battleServerUrl = '';
  socketConnected = false;
  creatingRoom = false;
  joiningRoom = false;
  lockingTeam = false;
  teamLockError = '';
  inviteUrl = '';
  battleMenuPanel: BattleMenuPanel = 'commands';

  battleConfigForm: FormGroup;
  movesCatalog: MovesCatalog | null = null;
  pokedexSlice: Pokemon[] = [];
  eligibleBattleItems: Item[] = [];
  moveSetupPokemonId: string | null = null;

  private subs = new Subscription();
  private autoJoinAttempted = false;
  private lastCombatTurn = 0;

  constructor(
    public session: BattleSessionService,
    private battleService: BattleService,
    private pokemonService: PokemonService,
    private itemService: ItemService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.battleConfigForm = this.fb.group({
      level: [50, [Validators.required]],
      teamSize: [6, [Validators.required, Validators.min(1), Validators.max(6)]],
      useItems: [false],
      allowHealing: [true],
      allowStat: [true],
      itemSlotCount: [6, [Validators.min(1), Validators.max(6)]],
      itemStackLimit: [3, [Validators.min(1), Validators.max(99)]],
      totalItemPool: [10, [Validators.min(1), Validators.max(99)]],
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
        } else if (phase === 'setupMoves') {
          this.workspaceStep = 'moves';
          this.ensureMoveSetupPokemon();
        } else if (phase === 'setupItems') {
          this.workspaceStep = 'items';
          void this.refreshEligibleBattleItems();
        } else if (phase === 'active' || phase === 'finished') {
          this.workspaceStep = 'battle';
        }
        this.cdr.markForCheck();
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
    this.subs.add(
      this.session.playerCount$.subscribe(() => this.cdr.markForCheck())
    );
    this.subs.add(
      this.session.maxPlayers$.subscribe(() => this.cdr.markForCheck())
    );
    this.subs.add(
      this.session.role$.subscribe(() => this.cdr.markForCheck())
    );
    this.subs.add(
      this.session.combatState$.subscribe((combat) => {
        if (combat && combat.turn !== this.lastCombatTurn) {
          this.lastCombatTurn = combat.turn;
          this.battleMenuPanel = 'commands';
        }
        if (combat?.winnerId) {
          this.battleMenuPanel = 'commands';
        }
        if (
          combat &&
          (combat.battleStarted || combat.awaitingMoves.length > 0)
        ) {
          this.workspaceStep = 'battle';
        }
        this.cdr.markForCheck();
      })
    );
    this.subs.add(
      this.session.availableMoves$.subscribe(() => this.cdr.markForCheck())
    );

    this.subs.add(
      this.session.selectedBagItems$.subscribe(() => this.cdr.markForCheck())
    );
    this.subs.add(
      this.session.heldItemsByPokemon$.subscribe(() => this.cdr.markForCheck())
    );
    this.subs.add(
      this.session.battleConfig$.subscribe(() => {
        void this.refreshEligibleBattleItems();
      })
    );

    firstValueFrom(this.pokemonService.getMovesCatalog()).then((c) => {
      this.movesCatalog = c;
    });
    this.pokemonService.getPokedex().subscribe((list) => {
      this.pokedexSlice = list.filter(
        (p) => Number(p.id) <= GEN1_POKEMON_COUNT
      );
    });
    void this.refreshEligibleBattleItems();

    this.tryAutoJoinFromUrl();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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

  get teamSizeLimit(): number {
    return this.session.battleConfig$.value?.teamSize ?? 6;
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
    const allowedItemTypes: BattleItemType[] = [];
    if (v.allowHealing) {
      allowedItemTypes.push('healing');
    }
    if (v.allowStat) {
      allowedItemTypes.push('stat');
    }
    if (v.useItems && allowedItemTypes.length === 0) {
      this.createError = 'Select at least one item type when items are enabled.';
      this.creatingRoom = false;
      this.cdr.markForCheck();
      return;
    }

    const payload: BattleConfigEventPayload = {
      level: v.level,
      teamSize: v.teamSize,
      useItems: v.useItems,
      itemQuantity: v.useItems ? v.itemSlotCount : 0,
      itemSlotCount: v.useItems ? v.itemSlotCount : 0,
      itemStackLimit: v.useItems ? v.itemStackLimit : 0,
      totalItemPool: v.useItems ? v.totalItemPool : 0,
      allowedItemTypes: v.useItems ? allowedItemTypes : [],
      maxPlayers: 2,
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

    this.joiningRoom = true;
    try {
      await this.session.waitForServer();
      this.socketConnected = true;
      await this.session.joinRoom(key);
      this.joinRoomKey = key;
      this.roomMode = 'choose';
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
    if (
      step === 'moves' &&
      this.session.phase$.value !== 'setupMoves' &&
      this.session.phase$.value !== 'setupItems' &&
      this.session.phase$.value !== 'active' &&
      this.session.phase$.value !== 'finished' &&
      !this.session.canProceedToMoveSetup()
    ) {
      return;
    }
    if (
      step === 'items' &&
      this.session.phase$.value !== 'setupItems' &&
      this.session.phase$.value !== 'active' &&
      this.session.phase$.value !== 'finished' &&
      !this.session.canProceedToItemSetup()
    ) {
      return;
    }
    if (
      step === 'battle' &&
      this.session.phase$.value !== 'active' &&
      this.session.phase$.value !== 'finished'
    ) {
      return;
    }
    this.workspaceStep = step;
    if (step === 'moves') {
      this.ensureMoveSetupPokemon();
    }
    if (step === 'items') {
      void this.refreshEligibleBattleItems();
    }
  }

  proceedToItemSetup(): void {
    this.session.proceedToItemSetup();
    this.workspaceStep = 'items';
    void this.refreshEligibleBattleItems();
    this.cdr.markForCheck();
  }

  async refreshEligibleBattleItems(): Promise<void> {
    if (!this.session.itemsEnabled()) {
      this.eligibleBattleItems = [];
      return;
    }
    this.eligibleBattleItems = await this.session.loadEligibleBattleItems();
    this.cdr.markForCheck();
  }

  itemRulesSummary(): string {
    const rules = this.session.getItemRules();
    const types = rules.allowedItemTypes
      .map((t) => (t === 'healing' ? 'Healing' : 'Stat boosts'))
      .join(', ');
    return `${types} · ${rules.itemSlotCount} slots · max ${rules.itemStackLimit} each · ${rules.totalItemPool} total uses`;
  }

  bagItemQuantity(itemId: number): number {
    return this.session.getBagItemQuantity(itemId);
  }

  bagSlotsUsed(): number {
    return this.session.getBagSlotsUsed();
  }

  bagTotalUses(): number {
    return this.session.getBagTotalUses();
  }

  canIncreaseBagItem(item: Item): boolean {
    const rules = this.session.getItemRules();
    const current = this.bagItemQuantity(item.id);
    if (current >= rules.itemStackLimit) {
      return false;
    }
    if (current === 0 && this.bagSlotsUsed() >= rules.itemSlotCount) {
      return false;
    }
    return this.bagTotalUses() < rules.totalItemPool;
  }

  increaseBagItem(item: Item): void {
    this.session.setBagItemQuantity(item.id, this.bagItemQuantity(item.id) + 1);
    this.cdr.markForCheck();
  }

  decreaseBagItem(item: Item): void {
    this.session.setBagItemQuantity(item.id, this.bagItemQuantity(item.id) - 1);
    this.cdr.markForCheck();
  }

  holdableBagItems(): Item[] {
    return this.eligibleBattleItems.filter(
      (item) =>
        this.bagItemQuantity(item.id) > 0 && this.itemService.isHoldable(item)
    );
  }

  setHeldItem(pokemonId: string, itemId: number | null): void {
    this.session.setHeldItemForPokemon(pokemonId, itemId);
    this.cdr.markForCheck();
  }

  getHeldItemId(pokemonId: string): number | null {
    return this.session.getHeldItemForPokemon(pokemonId);
  }

  canProceedToItems(): boolean {
    return this.session.canProceedToItemSetup();
  }

  allItemsConfigured(): boolean {
    return this.session.allItemsConfigured();
  }

  backToMoveSetup(): void {
    if (this.session.teamLocked$.value) {
      return;
    }
    this.session.phase$.next('setupMoves');
    this.workspaceStep = 'moves';
    this.cdr.markForCheck();
  }

  itemEffectSnippet(item: Item): string {
    const entry = item.effect_entries?.find((e) => e.language?.name === 'en');
    return entry?.short_effect ?? '';
  }

  proceedToMoveSetup(): void {
    this.session.proceedToMoveSetup();
    this.workspaceStep = 'moves';
    this.ensureMoveSetupPokemon();
    this.cdr.markForCheck();
  }

  ensureMoveSetupPokemon(): void {
    const team = this.session.selectedTeam$.value;
    if (!team.length) {
      this.moveSetupPokemonId = null;
      return;
    }
    const current = this.moveSetupPokemonId;
    if (!current || !team.some((p) => String(p.id) === current)) {
      this.moveSetupPokemonId = String(team[0]!.id);
    }
  }

  selectMoveSetupPokemon(pokemon: Pokemon): void {
    this.moveSetupPokemonId = String(pokemon.id);
    this.cdr.markForCheck();
  }

  get moveSetupPokemon(): Pokemon | null {
    const id = this.moveSetupPokemonId;
    if (!id) {
      return null;
    }
    return (
      this.session.selectedTeam$.value.find((p) => String(p.id) === id) ??
      null
    );
  }

  eligibleMovesFor(pokemon: Pokemon): BattleMove[] {
    if (!this.movesCatalog) {
      return [];
    }
    const level = this.session.battleConfig$.value?.level ?? 50;
    return this.battleService.getEligibleMoves(pokemon, level, this.movesCatalog);
  }

  maxMovesFor(pokemon: Pokemon): number {
    if (!this.movesCatalog) {
      return 4;
    }
    const level = this.session.battleConfig$.value?.level ?? 50;
    return this.battleService.maxSelectableMoves(
      pokemon,
      level,
      this.movesCatalog
    );
  }

  selectedMoveCount(pokemonId: string): number {
    return this.session.selectedMovesByPokemon$.value[pokemonId]?.length ?? 0;
  }

  isMoveSelected(pokemonId: string, moveId: number): boolean {
    return (
      this.session.selectedMovesByPokemon$.value[pokemonId]?.includes(moveId) ??
      false
    );
  }

  toggleMoveSelection(pokemonId: string, moveId: number): void {
    const pokemon = this.session.selectedTeam$.value.find(
      (p) => String(p.id) === pokemonId
    );
    const max = pokemon ? this.maxMovesFor(pokemon) : 4;
    this.session.toggleMoveForPokemon(pokemonId, moveId, max);
    this.cdr.markForCheck();
  }

  canSelectMoreMoves(pokemon: Pokemon): boolean {
    return this.selectedMoveCount(String(pokemon.id)) < this.maxMovesFor(pokemon);
  }

  canProceedToMoves(): boolean {
    return this.session.canProceedToMoveSetup();
  }

  allMovesConfigured(): boolean {
    return this.session.allTeamMovesConfigured();
  }

  backToTeamSetup(): void {
    if (this.session.teamLocked$.value) {
      return;
    }
    this.session.phase$.next('setupTeam');
    this.workspaceStep = 'team';
    this.cdr.markForCheck();
  }

  async confirmTeam(): Promise<void> {
    this.teamLockError = '';
    this.lockingTeam = true;
    try {
      await this.session.confirmTeam();
    } catch (err) {
      this.teamLockError =
        err instanceof Error ? err.message : 'Could not lock in team.';
    } finally {
      this.lockingTeam = false;
      this.cdr.markForCheck();
    }
  }

  selectMove(moveId: number): void {
    const move = this.session.availableMoves$.value.find((m) => m.id === moveId);
    if (move && move.currentPp <= 0) {
      return;
    }
    this.session.submitMove(moveId);
    this.battleMenuPanel = 'commands';
    this.cdr.markForCheck();
  }

  selectSwitch(pokemonIndex: number): void {
    this.session.submitSwitch(pokemonIndex);
    this.battleMenuPanel = 'commands';
    this.cdr.markForCheck();
  }

  selectItem(itemId: number): void {
    this.session.submitItem(itemId);
    this.battleMenuPanel = 'commands';
    this.cdr.markForCheck();
  }

  requestRematch(): void {
    this.session.requestRematch();
    this.battleMenuPanel = 'commands';
    this.cdr.markForCheck();
  }

  leaveRoom(): void {
    this.session.reset();
    this.workspaceStep = 'room';
    this.roomMode = 'choose';
    this.battleMenuPanel = 'commands';
    this.cdr.markForCheck();
  }

  getLocalTeamSnapshot(): BattleTeamMember[] {
    return this.session.getLocalTeamSnapshot();
  }

  getLocalBagSnapshot(): BattleBagSnapshot[] {
    return this.session.getLocalBagSnapshot();
  }

  openBattleMenu(panel: BattleMenuPanel): void {
    if (!this.session.isAwaitingLocalMove()) {
      return;
    }
    this.battleMenuPanel = panel;
    this.cdr.markForCheck();
  }

  backToBattleCommands(): void {
    this.battleMenuPanel = 'commands';
    this.cdr.markForCheck();
  }

  confirmEndFight(): void {
    this.session.forfeitMatch();
    this.battleMenuPanel = 'commands';
    this.cdr.markForCheck();
  }

  itemsEnabled(): boolean {
    return this.session.itemsEnabled();
  }

  battlePrompt(): string {
    const combat = this.session.combatState$.value;
    if (combat?.message) {
      return combat.message;
    }
    if (this.session.isAwaitingLocalMove()) {
      return `What will ${this.session.getActivePokemonName()} do?`;
    }
    return 'Waiting for the opponent…';
  }

  isLocalWinner(): boolean {
    const combat = this.session.combatState$.value;
    const selfId = this.session.getLocalSocketId();
    return !!combat?.winnerId && combat.winnerId === selfId;
  }

  isPokemonSelected(p: Pokemon): boolean {
    return this.session.selectedTeam$.value.some(
      (x) => String(x.id) === String(p.id)
    );
  }

  togglePokemon(p: Pokemon): void {
    if (this.session.teamLocked$.value) {
      return;
    }
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
      if (this.autoJoinAttempted) {
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
          if (connected) {
            attemptJoin();
          }
        })
      );
    }
  }
}
