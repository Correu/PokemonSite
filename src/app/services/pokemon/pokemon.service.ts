import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { Pokemon } from '../../interfaces/pokemon';
import { BattleMove, MovesCatalog } from '../../interfaces/move';
import { AbilitiesCatalog, CatalogAbility } from '../../interfaces/ability';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private pokemonJson = 'assets/data/pokemon.json';
  private typeJson = 'assets/data/types.json';
  private movesJson = 'assets/data/moves.json';
  private abilitiesJson = 'assets/data/abilities.json';

  battleLoad!: boolean;
  pokedexLoad!: boolean;
  pokedex: Pokemon[] = [];

  playerTeam: Pokemon[] = [];
  enemyTeam: Pokemon[] = [];
  private movesCatalogCache: MovesCatalog | null = null;
  private abilitiesCatalogCache: AbilitiesCatalog | null = null;

  private readonly selectedPokedexSubject = new BehaviorSubject<
    Pokemon | undefined
  >(undefined);
  readonly selectedPokedexPokemon$ =
    this.selectedPokedexSubject.asObservable();

  setPokedexSelection(pokemon: Pokemon | undefined): void {
    this.selectedPokedexSubject.next(pokemon);
  }

  get selectedPokedexPokemon(): Pokemon | undefined {
    return this.selectedPokedexSubject.value;
  }
  
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

  getMovesCatalog(): Observable<MovesCatalog> {
    if (this.movesCatalogCache) {
      return of(this.movesCatalogCache);
    }

    return this.http.get<MovesCatalog>(this.movesJson).pipe(
      tap((catalog) => {
        this.movesCatalogCache = catalog;
      })
    );
  }

  getMoveById(id: number): Observable<BattleMove | undefined> {
    return this.getMovesCatalog().pipe(map((catalog) => catalog.byId[String(id)]));
  }

  getAbilitiesCatalog(): Observable<AbilitiesCatalog> {
    if (this.abilitiesCatalogCache) {
      return of(this.abilitiesCatalogCache);
    }

    return this.http.get<AbilitiesCatalog>(this.abilitiesJson).pipe(
      tap((catalog) => {
        this.abilitiesCatalogCache = catalog;
      })
    );
  }

  getAbilityByName(name: string): Observable<CatalogAbility | undefined> {
    return this.getAbilitiesCatalog().pipe(
      map((catalog) => catalog.byName[name])
    );
  }
}
