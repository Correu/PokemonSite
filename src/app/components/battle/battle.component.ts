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

  playerTeam: Array<Pokemon> = [];



  constructor(private pokemonService: PokemonServiceService) { }

  ngOnInit(): void {
    //methods to initialize

  }

  //hit a random 6 pokemon between 1-151
  //assign them to each team
  buildTeam() {
    this.pokemonService.getPokedex().subscribe(res => {
      for(let index = 0; index < res.results.length; index++) {
        const element = res.results[index];
        this.pokemonService.getPokemon(element.url).subscribe(resource => {
          this.playerTeam.push({pokemonId: resource.id, pokemonName: resource.name, pokemonUrl: element.url, pokemonImageUrl: resource.sprites.back_default})
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
}
