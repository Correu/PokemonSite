import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { Pokemon } from '../../interfaces/pokemon';
import { Move } from '../../interfaces/move';
import { DefaultList } from 'src/app/interfaces/defaultList';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private pokemonJson = 'assets/data/pokemon.json';
  private typeJson = 'assets/data/types.json';

  battleLoad!: boolean;
  pokedexLoad!: boolean;
  pokedex: Pokemon[] = [];

  playerTeam: Pokemon[] = [];
  enemyTeam: Pokemon[] = [];

  generations = [
    { name: 'Generation 1', quantity: 151, start: 0 },
    { name: 'Generation 2', quantity: 100, start: 151 },
    { name: 'Generation 3', quantity: 135, start: 251 },
    { name: 'Generation 4', quantity: 107, start: 386 },
    { name: 'Generation 5', quantity: 156, start: 493 },
    { name: 'Generation 6', quantity: 72, start: 649 },
    { name: 'Generation 7', quantity: 88, start: 722 },
    { name: 'Generation 8', quantity: 96, start: 809 },
    { name: 'Generation 9', quantity: 120, start: 906 },
  ];

  constructor(private http: HttpClient) {}

  //returns pokedex from local json
  getPokedex(): Observable<Pokemon[]> {
    return this.http.get<Pokemon[]>(this.pokemonJson);
  }

  //gets pokemon based on id from local json
  //update to differentiate between local json and api requests?
  getPokemon(id: string): Observable<Pokemon | undefined> {
    return this.http
      .get<Pokemon[]>(this.pokemonJson)
      .pipe(
        map((pokemons: Pokemon[]) =>
          pokemons.find((pokemon) => pokemon.id === id)
        )
      );
  }

  //gets pokemon based on name from local json
  //update to differentiate between local json and api requests?
  getPokemonByName(name: string): Observable<Pokemon | undefined> {
    console.log(name);
    return this.http
      .get<Pokemon[]>(this.pokemonJson)
      .pipe(
        map((pokemons: Pokemon[]) =>
          pokemons.find((pokemon) => pokemon.name.toLowerCase() === name)
        )
      );
  }

  //gets types for the pokemon dialog based on the selected pokemons type list.
  getTypes(typeNames: string[]): Observable<any[]> {
    return this.http.get<any[]>(this.typeJson).pipe(
      tap((data) => console.log('Fetched Types Data:', data)),
      map((response) => {
        const typesList = response.length > 0 ? response[0].types : [];

        if (!Array.isArray(typesList)) {
          throw new Error('Expected "types" to be an array.');
        }

        return typesList.filter((type) => typeNames.includes(type.name));
      })
    );
  }

  getMoves(): Observable<DefaultList> {
    return this.http.get<DefaultList>(
      'https://pokeapi.co/api/v2/move/?limit=937'
    );
  }

  getMove(name: string): Observable<Move> {
    let url = 'https://pokeapi.co/api/v2/move/' + name;
    return this.http.get<Move>(url);
  }
}
