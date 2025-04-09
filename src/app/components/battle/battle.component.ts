import { Component, Injectable, OnInit } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { MatDialog } from '@angular/material/dialog';
import { BattleDialogComponent } from '../../dialogs/battle-dialog/battle-dialog.component';
import { BattleService } from 'src/app/services/battle/battle.service';
import { ItemService } from 'src/app/services/items/item.service';
import { Item } from 'src/app/interfaces/item';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrls: ['./battle.component.css'],
})
@Injectable()
export class BattleComponent implements OnInit {
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

  constructor(
    private pokemonService: PokemonService,
    private battleService: BattleService,
    private itemService: ItemService,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.pokemonService.battleLoad) {
      this.intialDialog();
      const { teamA, teamB } = await this.battleService.getRandomTeams();
      this.teamA = teamA;
      this.teamB = teamB;
      console.log('Teams loaded:', this.teamA, this.teamB);

      // Fetch random items for both players
      this.loadItems();
    }
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

  private intialDialog() {
    const dialogRef = this.dialog.open(BattleDialogComponent);

    dialogRef.afterClosed().subscribe((data) => {
      this.selectedLevel = data;
      console.log(this.selectedLevel + ' ' + data);
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
