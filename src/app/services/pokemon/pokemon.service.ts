import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Pokemon } from '../../interfaces/pokemon';

@Injectable({
  providedIn: 'root'
})

export class PokemonService {

  //get pokemon by id
  battleLoad!: boolean;
  
  pokemonIds: PokeIds[] = [];
  pokedex: Pokemon[] = [];

  playerTeam: Pokemon[] = [];
  enemyTeam: Pokemon[] = [];

  constructor(private http:HttpClient) {   }

  //returns original data from the endpoints
  public getPokemonById(id: string): Observable<Pokemon> {
    let url = 'https://pokeapi.co/api/v2/pokemon/' + id;
    //console.log(url);
    return this.http.get<Pokemon>(url);
  }

  //get the pokemon and return an array to of pokemon adjusted to handle a battle
  //i.e. changes stats based on level and randomly selects 4 moves within a range selected.
  public getPokemonForBattle(id: string): Observable<Pokemon> {
    //remove all but 4 moves
    //calculate skills based on a selected level
    //add pp to the moves for limits.
    let url = 'https://pokeapi.co/api/v2/pokemon/' + id;
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

