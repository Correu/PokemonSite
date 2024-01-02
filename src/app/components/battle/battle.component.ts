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

  //two random teams of 6 pokemon
  //each pokemon has a level and a 
  //each pokemon has 4 moves random up to the current level they are at
  //turn based

  playerTeam: Pokemon[] = [];
  enemyTeam: Pokemon[] = [];



  constructor(private pokemonService: PokemonService) { }

  ngOnInit(): void {
    //methods to initialize
    this.buildPlayerTeam();
    this.buildEnemyTeam();
  }

  //assign them to playerteam
  private buildPlayerTeam(): void {
    for (let i = 0; i < 6; i++) {
      this.pokemonService.getPokemonById(Math.floor(Math.random() * 1010).toString()).subscribe((res: any) => {
        this.playerTeam.push(res);
      });
    }
  }

  //assigns the enemyteam
  private buildEnemyTeam(): void {
    for(let i = 0; i < 6; i++) {
      this.pokemonService.getPokemonById(Math.floor(Math.random() * 1010).toString()).subscribe((res: any) => {
        this.enemyTeam.push(res);
      });
    }
  }

  //gen 1 & 2 hp calculation
  //hp = [(((Base + DV) * 2 + [sqrt(statexp)/4]) * level)/100] + Level + 10
}