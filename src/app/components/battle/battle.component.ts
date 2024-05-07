import { Component, Injectable, OnInit } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { MatDialog } from '@angular/material/dialog';
import { BattleDialogComponent } from '../battle-dialog/battle-dialog.component';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrls: ['./battle.component.css'],
})

@Injectable()
export class BattleComponent implements OnInit {

  //implement a bag of items to select from to heal statuses in battle
  //implement change pokemon out functionality
  //implement level select to start the match
  

  //assign the values to display, carried from the service.
  playerTeam: Pokemon[] = this.pokemonService.playerTeam;
  enemyTeam: Pokemon[] = this.pokemonService.enemyTeam;
  
  constructor(private pokemonService: PokemonService, private dialog: MatDialog) {
      
  }

  ngOnInit(): void {
    if(!this.pokemonService.battleLoad) {
      this.intialDialog();
      this.buildPlayerTeam();
      this.buildEnemyTeam();
    }    
  }

  private intialDialog() {
    const dialogRef = this.dialog.open(BattleDialogComponent);

    dialogRef.afterClosed().subscribe( result => {
      console.log(result);
    });
  }

  //assign them to playerteam
  private buildPlayerTeam(): void {
    for (let i = 0; i < 6; i++) {
      this.pokemonService.getPokemonById(Math.floor(Math.random() * 1010).toString()).subscribe((res: any) => {
        this.pokemonService.playerTeam.push(res);
      });
    }

    console.log(this.pokemonService.playerTeam.at(1)?.moves);
    //remove moves to get only 4 within a specific level
    this.changeMoveset(this.pokemonService.playerTeam);
    console.log(this.pokemonService.playerTeam.at(1)?.moves);
    this.pokemonService.battleLoad = true;

    this.playerTeam = this.pokemonService.playerTeam;
  }

  //assigns the enemyteam
  private buildEnemyTeam(): void {
    for (let i = 0; i < 6; i++) {
      this.pokemonService.getPokemonById(Math.floor(Math.random() * 1010).toString()).subscribe((res: any) => {
        this.pokemonService.enemyTeam.push(res);
      });
    }
  }

  private changeMoveset(pokemon: Pokemon[] ): void {
    this.pokemonService.playerTeam.at(0)?.moves.filter((move) => move.version_group_details.at(0)!.level_learned_at > 50);
  }

  //gen 1 & 2 hp calculation
  //hp = [(((Base + DV) * 2 + [sqrt(statexp)/4]) * level)/100] + Level + 10
}