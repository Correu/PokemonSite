import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pokemon, Sprite } from '../interfaces/pokemon';

@Injectable({
  providedIn: 'root'
})

export class PokemonService {

  pokemonIds: PokeIds[] = [];
  pokedex: Pokemon[] = [];

  constructor(private http:HttpClient) {

    this.getPokedex().subscribe(res => {
      res.results.forEach((pokem: { name: any; url: any; }) => {
        const poke: PokeIds = {
          name: pokem.name,
          url: pokem.url,
        };
          this.pokemonIds.push(poke);
      });
    }, err => console.error("test error" + err), () => console.log("Observable completed"));
    
    this.pokemonIds.forEach( async (id) => {
      console.log("Test");
      (await this.getPokemon(id.url)).subscribe(p => {
        const sprite: Sprite = {
          frontDefault: p.sprites.front_default,
          backDefault: p.sprites.back_default,
          frontShiny: p.sprites.front_default_shiny,
          backShiny: p.sprites.back_shiny,
        };

        const pokemon: Pokemon = {
          id: p.id,
          name: p.name,
          baseExperience: p.base_experience,
          height: p.height,
          order: p.order,
          weight: p.weight,
          abilities: p.ability,
          forms: p.forms,
          heldItems: p.item,
          moves: p.moves.move,
          sprites: sprite,
          stats: p.stat
        };

        this.pokedex.push(pokemon);
      })
    });
    console.log(this.pokedex);
   }

  async getPokemon(name:string): Promise<Observable<any>> {
    return this.http.get(name);
  }

  public getPokemonById(id: string): Observable<any> {
    let url = 'https://pokeapi.co/api/v2/pokemon/' + id;
    //console.log(url);
    return this.http.get(url);
  }

  public getPokedex(): Observable<any> {
    let url = 'https://pokeapi.co/api/v2/pokemon/?limit=100';
    return this.http.get(url);
  }

  public getPokedexList() {
    return this.pokedex;
  }

  public getPokeIdList() {
    return this.pokemonIds;
  }
}

type PokeIds = {
  name: string,
  url: string;
}
