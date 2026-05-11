import { Component, Injectable } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { BattleService } from 'src/app/services/battle/battle.service';
import { ItemService } from 'src/app/services/items/item.service';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { SocketService } from 'src/app/services/socket/socket.service';
import { Item } from 'src/app/interfaces/item';
import {
  BattleConfigEventPayload,
  BattleTurnEventPayload,
  GameEventEnvelope,
} from 'src/app/interfaces/battle-event';

@Component({
    selector: 'app-battle',
    templateUrl: './battle.component.html',
    styleUrls: ['./battle.component.css'],
    standalone: false
})

@Injectable()
export class BattleComponent {
  /** When true, only the placeholder UI is shown; full flow is disabled. */
  readonly battleUnderDevelopment = true;

  //assign the values to display, carried from the service.
  playerTeam: Pokemon[] = this.pokemonService.playerTeam;
  enemyTeam: Pokemon[] = this.pokemonService.enemyTeam;

  selectedLevel: number = 0;

  teamA: Pokemon[] = [];
  teamB: Pokemon[] = [];

  // Item arrays
  playerItems: Item[] = [];
  enemyItems: Item[] = [];

  showPokemonStats: boolean = false;
  showPokemonSelect: boolean = false;
  showItemSelect: boolean = false;
  currentPokemonIndex: number = 0;

  // Battle flow state
  currentStep: number = 1;
  mode: 'choose' | 'create' | 'join' = 'choose';
  battleKey: string = '';
  joinRoomKey: string = '';
  joinError: string = '';
  battleConfig: any = null;
  battleStarted: boolean = false;

  // Options for dropdowns
  levelOptions: number[] = Array.from({ length: 100 }, (_, i) => i + 1);
  generationOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  roomId: string = '';
  players: string[] = [];

  roomIdFormControl = new FormControl('', [Validators.required]);
  messageForm: FormGroup;
  battleConfigForm: FormGroup;

  constructor(
    private pokemonService: PokemonService,
    private battleService: BattleService,
    private itemService: ItemService,
    private socketService: SocketService,
    private fb: FormBuilder
  ) {
    this.messageForm = this.fb.group({
      message: [''],
    });
    
    this.battleConfigForm = this.fb.group({
      level: [50, [Validators.required]], // Default to level 50
      generation: [null], // null means all generations
      useItems: [false], // Slide toggle for enabling/disabling items
    });
  }

  async ngOnInit(): Promise<void> {
    if (this.battleUnderDevelopment) {
      return;
    }
    if (!this.pokemonService.battleLoad) {
      const { teamA, teamB } = await this.battleService.getRandomTeams();
      this.teamA = teamA;
      this.teamB = teamB;
      console.log('Teams loaded:', this.teamA, this.teamB);

      // Fetch random items for both players
      this.loadItems();
    }
  }

  pushButton() {
    // this.socketService.sendGameEvent(this.roomId, {
    //   move: 'attack',
    //   damage: 15,
    // });

    this.socketService.sendMessage(
      this.messageForm.value.message,
      'this is a test hit to the server'
    );
  }

  selectMode(selected: 'create' | 'join') {
    this.mode = selected;
    if (selected === 'create') {
      this.currentStep = 2; // Show battle configuration form
    }
  }

  async tryJoinRoom() {
    this.joinError = '';
    this.socketService.joinRoom(this.joinRoomKey, (response: any) => {
      if (response && response.success) {
        this.battleKey = this.joinRoomKey;
        this.currentStep = 4; // Show waiting screen for join mode
      } else {
        this.joinError = response?.error || 'Failed to join room.';
      }
    });
  }

  cancelCreate() {
    this.mode = 'choose';
    this.currentStep = 1;
    this.battleConfigForm.reset({
      level: 50,
      generation: null,
      useItems: false,
    });
  }

  cancelJoin() {
    this.mode = 'choose';
    this.currentStep = 1;
    this.joinRoomKey = '';
    this.joinError = '';
  }

  async submitBattleConfig() {
    if (this.battleConfigForm.valid) {
      try {
        // Create the game room
        this.battleKey = await this.socketService.createGame();
        this.socketService.joinRoom(this.battleKey);

        // Prepare battle configuration
        const formValue = this.battleConfigForm.value;
        const configPayload: BattleConfigEventPayload = {
          level: formValue.level,
          generation: formValue.generation,
          useItems: formValue.useItems,
          itemQuantity: formValue.useItems ? 6 : 0, // Default to 6 items if enabled
        };
        this.battleConfig = configPayload;

        const configEvent: GameEventEnvelope = {
          type: 'battle:config',
          version: 1,
          payload: configPayload,
        };

        // Send battle configuration to server
        this.socketService.sendGameEvent(this.battleKey, configEvent);

        // Move to room key sharing step
        this.currentStep = 3;
      } catch (err) {
        alert('Failed to create room. Please try again.');
        console.error('Error creating room:', err);
      }
    }
  }

  startBattle() {
    this.battleStarted = true;
    // Additional battle start logic here
  }

  /**
   * Transport-ready turn event payload for future battle flow rollout.
   * Uses move IDs from local moves.json instead of move names.
   */
  sendTurnEvent(
    actorId: string,
    moveId: number,
    targetSlot: number,
    turnNumber: number
  ): void {
    if (!this.battleKey) return;
    const turnPayload: BattleTurnEventPayload = {
      actorId,
      moveId,
      targetSlot,
      turnNumber,
    };
    const turnEvent: GameEventEnvelope = {
      type: 'battle:turn',
      version: 1,
      payload: turnPayload,
    };
    this.socketService.sendGameEvent(this.battleKey, turnEvent);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Battle key copied to clipboard');
    });
  }

  private loadItems(): void {
    // Get 30 random items for the player
    this.itemService.getRandomItems().subscribe((items) => {
      this.playerItems = items;
      console.log('Player items loaded:', this.playerItems);
    });

    // Get 30 random items for the enemy
    this.itemService.getRandomItems().subscribe((items) => {
      this.enemyItems = items;
      console.log('Enemy items loaded:', this.enemyItems);
    });
  }

  showStats(): void {
    this.showPokemonStats = true;
  }

  hideStats(): void {
    this.showPokemonStats = false;
  }

  selectPokemon(index: number): void {
    this.currentPokemonIndex = index;
    this.showPokemonSelect = false;
  }

  showItems(): void {
    this.showItemSelect = true;
  }

  hideItems(): void {
    this.showItemSelect = false;
  }

  useItem(item: Item): void {
    // Implement item usage logic here
    console.log(`Using item: ${item.name}`);
    this.hideItems();
  }

  getItemDescription(item: Item): string {
    // Find the English description from flavor_text_entries
    const englishEntry = item.flavor_text_entries?.find(
      (entry) => entry.language.name === 'en'
    );

    if (englishEntry) {
      return englishEntry.text;
    }


    // Fallback to effect entries if flavor text is not available
    const englishEffect = item.effect_entries?.find(
      (entry) => entry.language.name === 'en'
    );

    if (englishEffect) {
      return englishEffect.short_effect;
    }
    return 'No description available';
  }
}
