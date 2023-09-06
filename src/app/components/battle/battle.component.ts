import { Component, Injectable, OnInit } from '@angular/core';
import { PokemonServiceService } from '../services/pokemon-service.service';

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



  constructor(private pokemonService: PokemonServiceService) { }

  ngOnInit(): void {
    //methods to initialize
    this.buildTeam();
  }

  //hit a random 6 pokemon between 1-151
  //assign them to each team
  buildTeam() {
    this.pokemonService.getPokedex().subscribe(res => {
      for(let index = 0; index < res.results.length; index++) {
        const element = res.results[index];
        this.pokemonService.getPokemon(element.url).subscribe(p => {
          //console.log(p);
          const pokemon: Pokemon = {
            pokemonId: p.id,
            pokemonName:  p.name,
            pokemonUrl: element.url,
            pokemonImageUrl: "",
            pokemonStats: { name: " ", url: " "}
          }

          this.playerTeam.push(pokemon);
          //console.log(this.playerTeam);
        });
      }
    });
  }
}


type Team = {
  pokemon: Pokemon;   
}

type Pokemon = {
  pokemonId: number;
  pokemonName: String;
  pokemonUrl: String;
  pokemonImageUrl: String;
  pokemonStats: Array<Stats>;
}

type Stats = {
  baseStat: number;
  effort: number;
  stat: Stat;
}

type Stat = {
  statName: String;
  statUrl: String;
}