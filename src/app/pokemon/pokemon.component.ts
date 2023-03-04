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
  moves: any[] = [];
  constructor(private pokemonService: PokemonServiceService) { }
  
  ngOnInit(): void {
    this.buildTeam();
  }

  searchForPokemon(name: string) {
    this.pokemon = [];
    this.moves = [];
    this.pokemonName = '';
    this.pokemonService.getPokemon(name).subscribe(res => {
      this.pokemon = res.abilities;
      this.moves = res.moves;
      this.pokemonName = res.name;
      console.log(this.pokemon + " " + this.moves + this.pokemonName);
      window.alert(this.pokemon);
    });
  }

  buildTeam() {
    this.pokemon = [];
    this.pokemonService.getPokemon("1").subscribe(res => {
      this.pokemon = res.abilities;
      console.log("Testing init build team.");
      console.log(this.pokemon);
    })
  }
}