import { Component, Injectable, OnInit } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon.service';

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



  constructor(private pokemonService: PokemonService) { }

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
  pokemonName: string;
  pokemonUrl: string;
  pokemonImageUrl: string;
  pokemonStats: {name: string, url: string};
}

type Stats = {
  baseStat: number;
  effort: number;
  stat: Array<Stat>;
}

type Stat = {
  statName: string;
  statUrl: string;
}