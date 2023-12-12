import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Pokemon } from '../interfaces/pokemon';

@Injectable({
  providedIn: 'root'
})

export class PokemonService {

  //get pokemon by id
  
  pokemonIds: PokeIds[] = [];
  pokedex: Pokemon[] = [];

  constructor(private http:HttpClient) {   }

  public getPokemonById(id: string): Observable<Pokemon> {
    let url = 'https://pokeapi.co/api/v2/pokemon/' + id;
    //console.log(url);
    return this.http.get<Pokemon>(url);
  }

  public getPokedex(): Observable<PokeIds[]> {
    let url = 'https://pokeapi.co/api/v2/pokemon/?limit=151';
    return this.http.get<PokeIds[]>(url);
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

