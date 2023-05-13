import { Component, Injectable, OnInit } from '@angular/core';
import { PokemonServiceService } from '../services/pokemon-service.service';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css']
})

@Injectable()
export class PokedexComponent implements OnInit{
  
  pokemon: any[] = [];
  pokemonList: Array<Pokemon> = [];

  constructor(private pokemonService: PokemonServiceService) { }

  ngOnInit(): void {
    //methods to initialize
    this.getPokedex();
  }

  getPokedex() {
    this.pokemon = [];
    this.pokemonService.getPokedex().subscribe(res => {
      for (let index = 0; index < res.length; index++) {
        const element = res.resluts[index];
        this.pokemonService.getPokemon(element.url).subscribe(resource => {
          this.pokemonList.push({pokemonName: resource.name, pokemonUrl: element.url, pokemonImageUrl: resource.sprites.back_default})
        });
      }
    });
  }
}

type Pokemon = {
  pokemonName: String;
  pokemonUrl: String;
  pokemonImageUrl: String;
}
