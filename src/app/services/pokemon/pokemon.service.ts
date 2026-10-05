import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { Pokemon } from '../../interfaces/pokemon';
import { BattleMove, MovesCatalog } from '../../interfaces/move';
import { AbilitiesCatalog, CatalogAbility } from '../../interfaces/ability';
import {
  TypeChart,
  TypeMatchupChip,
  TypeMatchups,
} from '../../interfaces/type-chart';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private pokemonJson = 'assets/data/pokemon.json';
  private typeJson = 'assets/data/types.json';
  private movesJson = 'assets/data/moves.json';
  private abilitiesJson = 'assets/data/abilities.json';
  private typeChartJson = 'assets/data/type-chart.json';

  battleLoad!: boolean;
  pokedexLoad!: boolean;
  pokedex: Pokemon[] = [];

  playerTeam: Pokemon[] = [];
  enemyTeam: Pokemon[] = [];
  private movesCatalogCache: MovesCatalog | null = null;
  private abilitiesCatalogCache: AbilitiesCatalog | null = null;
  private typeChartCache: TypeChart | null = null;

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

  getTypeChart(): Observable<TypeChart> {
    if (this.typeChartCache) {
      return of(this.typeChartCache);
    }

    return this.http.get<TypeChart>(this.typeChartJson).pipe(
      tap((chart) => {
        this.typeChartCache = chart;
      })
    );
  }

  getTypeMatchups(typeNames: string[]): Observable<TypeMatchups> {
    return this.getTypeChart().pipe(
      map((chart) => this.computeTypeMatchups(typeNames, chart))
    );
  }

  private computeTypeMatchups(
    typeNames: string[],
    chart: TypeChart
  ): TypeMatchups {
    const speciesTypes = typeNames
      .map((t) => t.toLowerCase())
      .filter((t) => chart.types.includes(t));

    const weakTo: TypeMatchupChip[] = [];
    const resists: TypeMatchupChip[] = [];
    const immuneTo: TypeMatchupChip[] = [];
    const strongAgainst: TypeMatchupChip[] = [];
    const notVeryEffective: TypeMatchupChip[] = [];

    if (speciesTypes.length === 0) {
      return { weakTo, resists, immuneTo, strongAgainst, notVeryEffective };
    }

    for (const attacker of chart.types) {
      let defenseMul = 1;
      for (const defender of speciesTypes) {
        defenseMul *= chart.multipliers[attacker]?.[defender] ?? 1;
      }

      if (defenseMul === 0) {
        immuneTo.push({ type: attacker, multiplier: 0 });
      } else if (defenseMul >= 2) {
        weakTo.push({ type: attacker, multiplier: defenseMul });
      } else if (defenseMul < 1) {
        resists.push({ type: attacker, multiplier: defenseMul });
      }
    }

    // Offense: best STAB multiplier among the species' own types
    for (const defender of chart.types) {
      let best = 0;
      for (const attacker of speciesTypes) {
        const mul = chart.multipliers[attacker]?.[defender] ?? 1;
        if (mul > best) {
          best = mul;
        }
      }
      if (best >= 2) {
        strongAgainst.push({ type: defender, multiplier: best });
      } else if (best > 0 && best < 1) {
        notVeryEffective.push({ type: defender, multiplier: best });
      }
    }

    const byMulDesc = (a: TypeMatchupChip, b: TypeMatchupChip) =>
      b.multiplier - a.multiplier || a.type.localeCompare(b.type);
    const byMulAsc = (a: TypeMatchupChip, b: TypeMatchupChip) =>
      a.multiplier - b.multiplier || a.type.localeCompare(b.type);

    weakTo.sort(byMulDesc);
    resists.sort(byMulAsc);
    immuneTo.sort((a, b) => a.type.localeCompare(b.type));
    strongAgainst.sort(byMulDesc);
    notVeryEffective.sort(byMulAsc);

    return { weakTo, resists, immuneTo, strongAgainst, notVeryEffective };
  }
}
