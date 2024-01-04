import { Component, Injectable, OnInit } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';

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

  constructor(private pokemonService: PokemonService) {
      
  }

  ngOnInit(): void {
    if(!this.pokemonService.battleLoad) {
      this.buildPlayerTeam();
      this.buildEnemyTeam();
    }    
  }

  //assign them to playerteam
  private buildPlayerTeam(): void {
    for (let i = 0; i < 6; i++) {
      this.pokemonService.getPokemonById(Math.floor(Math.random() * 1010).toString()).subscribe((res: any) => {
        this.pokemonService.playerTeam.push(res);
      });
    }

    //remove moves to get only 4 within a specific level
    this.pokemonService.playerTeam.at(0)?.moves.at(0)

    this.pokemonService.battleLoad = true;
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
    //pokemon.filter()
  }

  //gen 1 & 2 hp calculation
  //hp = [(((Base + DV) * 2 + [sqrt(statexp)/4]) * level)/100] + Level + 10
}