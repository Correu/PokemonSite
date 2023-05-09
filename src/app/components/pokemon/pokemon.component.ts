import { Component, OnInit, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { PokemonServiceService } from '../services/pokemon-service.service';

@Component({
  selector: 'app-pokemon',
  templateUrl: './pokemon.component.html',
  styleUrls: ['./pokemon.component.css']
})


export class PokemonComponent implements OnInit {
  teamOne: any[] = [];
  teamTwo: any[] = [];
  pokemonName:string = '';
  pokemon: any[] = [];
  test: any[] = [];
  pokemonImage:string = '';
  pokemonList: Array<Pokemon> = [];
  randomTeam: any[] = [];
  moves: any[] = [];

  constructor(private pokemonService: PokemonServiceService) { }
  
  ngOnInit(): void {
    //this.buildTeams();
    this.getPokedex();
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

  /**
   * builds the individual users team, showing the first one and having the remainder in pokeballs in the inventory.
   */
  buildTeams() {
    this.teamOne = [];
    this.teamTwo = [];

    Math.random();
    this.pokemon = [];
    this.pokemonService.getPokemon("1").subscribe(res => {
      this.pokemon = res.name;
      this.pokemonList.push.apply(1, this.pokemon);
      console.log("Testing init build team.");
      console.log(this.pokemon);
      console.log(this.pokemonList);
    })
  }

  getPokedex() {
    this.pokemon = [];
    this.pokemonService.getPokedex().subscribe(res => {
      for (let index = 0; index < res.results.length; index++) {
        const element = res.results[index];
        this.pokemonService.getPokemon(element.url).subscribe(resource => {
          this.pokemonList.push({pokemonName: resource.name, pokemonUrl: element.url, pokemonImageUrl: resource.sprites.back_default})
        });
      }
      // this.pokemonService.getPokemon(res.results)
      // this.pokemon = res.results;
    });
  }

  generateRandomTeam() {

  }

  pokemonInfo(name: string) {
    this.pokemonImage;
    this.pokemonService.getPokemon(name).subscribe(res => {
      this.test = res.forms;
      this.pokemonImage = res.sprites.back_default;
      console.log(this.pokemonImage + " " + res)
    })
  }

}

type Pokemon = {
  pokemonName: String;
  pokemonUrl: String;
  pokemonImageUrl: String;
  
}