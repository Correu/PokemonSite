import { Component, Injectable, OnInit, Output, Input, ViewEncapsulation } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { PokedexList } from 'src/app/interfaces/pokedexList';
import { PokedexService } from 'src/app/services/pokedex/pokedex.service';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css'],
  // encapsulation: ViewEncapsulation.None
})

@Injectable()
export class PokedexComponent implements OnInit {

  //pass these values through to the next level on the page
  //selected pokedex variable
  @Input() selectedPokedex: string = '';
  //selected pokemon variable
  @Input() selectedPokemon: string = '';

  //more information about the pokemon in the pages.
  @Output() pokemonName: string = '';
  pokemon: any[] = [];
  pokemonList: PokeIds[] = [];
  pokedex: Pokemon[] = [];
  
  isLoading: boolean = true;
  pokedexList!: PokedexList;

  constructor(public pokemonService: PokemonService, public pokedexService: PokedexService) { }

  //initially load the page to the first pokedex (national dex)
  ngOnInit(): void {    
    this.getPokedexList();
    this.getPokemonList();
  }

  getPokedexList(): void {
    this.pokedexService.getPokedexList().subscribe((res: any) => {
      this.isLoading = true;
      this.pokedexList = res;
      this.isLoading = false;
    })
  }

  getPokemonList(): void {
    this.pokemonService.getPokedex().subscribe((res:any) =>{
      this.pokemonList = res.results;
    });
    this.pokedex = this.pokemonService.pokedex;
  }

  getSpecificPokedex(specificPokedex: string): void {
    this.pokedexService.getIndividualPokdex(specificPokedex).subscribe((res: any) => {
      this.pokedexList = res.results;
      this.pokemonList = res;
    });
  }

  updateViewingPokemon(pokemonName: string) {
    this.pokemonName = pokemonName;
  }
}
type PokeIds = {
  name: string,
  url: string;
}