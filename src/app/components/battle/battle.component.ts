import { Component, Injectable, OnInit } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon.service';
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
  opponentTeam: Pokemon[] = [];
  //pokeIds: PokeIds[] = [];



  constructor(private pokemonService: PokemonService) { }

  ngOnInit(): void {
    //methods to initialize
    this.buildTeam();
  }

  //hit a random 6 pokemon between 1-151
  //assign them to each team
  private buildTeam(): void {
    this.pokemonService.getPokemonById(Math.floor(Math.random() * 1253).toString()).subscribe((res: any)=> {
      this.playerTeam.push(res);
    });
  }
}