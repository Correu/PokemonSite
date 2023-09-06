import { Component, Injectable, OnInit } from '@angular/core';
import { PokemonServiceService } from '../services/pokemon-service.service';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css']
})

@Injectable()
export class PokedexComponent implements OnInit{

  //more information about the pokemon in the pages.
  
  pokemon: any[] = [];
  pokemonList: Array<Pokemon> = [];
  pokedex: Pokemon[] = [];

  constructor(private pokemonService: PokemonServiceService) { }

  ngOnInit(): void {
    //methods to initialize
    this.getPokedex();
  }

  getPokedex() {
    this.pokemonService.getPokedex().subscribe(pokemon => {
      // for (let index = 0; index < res.results.length; index++) {
      //   const element = res.results[index];
      //   this.pokemonService.getPokemon(element.url).subscribe(resource => {
      //     this.pokemonList.push({pokemonId: resource.id, pokemonName: resource.name, pokemonUrl: element.url, pokemonImageUrl: resource.sprites.back_default})
      //   });
      // }
      pokemon.results.forEach((element : any) => {
        const poke: Pokemon = {
          pokemonName: element.name,
          pokemonUrl: element.url
        }
  
        this.pokedex.push(poke);
      }); 

      console.log(pokemon);
      console.log(this.pokedex);
    });
  }
}



type Pokemon = {
  pokemonName: string;
  pokemonUrl: string;
}
