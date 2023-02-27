import { Component, OnInit } from '@angular/core';
import { PokemonServiceService } from '../services/pokemon-service.service';

@Component({
  selector: 'app-pokemon',
  templateUrl: './pokemon.component.html',
  styleUrls: ['./pokemon.component.css']
})
export class PokemonComponent implements OnInit {
  pokemonName:string = '';
  pokemon: any[] = [];
  constructor(private pokemonService: PokemonServiceService) { }
  
  ngOnInit(): void {
    
  }

  searchForPokemon(name: string) {
    this.pokemon = [];
    this.pokemonService.getPokemon(name).subscribe(res => {
      this.pokemon = res.abilities;
      console.log(this.pokemon);
    });
  }
}