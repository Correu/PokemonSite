import { Component, Injectable, OnInit, Output } from '@angular/core';
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
  @Output() pokemonName: string = '';
  pokemon: any[] = [];
  pokemonList: PokeIds[] = [];
  pokedex: Pokemon[] = [];
  pokemonList2: PokeIds[] = [];

  constructor(public pokemonService: PokemonService) { }

  ngOnInit(): void {
    //methods to initialize
    this.pokemonService.getPokedex().subscribe((res:any) =>{
      console.log(res);
      this.pokemonList = res.results
    });
    this.pokedex = this.pokemonService.pokedex;
  }

  updateViewingPokemon(pokemonName: string) {
    this.pokemonName = pokemonName;
  }
}
type PokeIds = {
  name: string,
  url: string;
}