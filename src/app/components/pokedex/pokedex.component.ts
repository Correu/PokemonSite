import { Component, Injectable, OnInit } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css'],
})

@Injectable()
export class PokedexComponent implements OnInit{

  //more information about the pokemon in the pages.
  
  pokemon: any[] = [];
  pokemonList: PokeIds[] = [];
  pokedex: Pokemon[] = [];

  constructor(public pokemonService: PokemonService) { }

  ngOnInit(): void {
    //methods to initialize
    this.pokemonList = this.pokemonService.getPokeIdList();
    console.log(this.pokemonList);
  }

}
type PokeIds = {
  name: string,
  url: string;
}