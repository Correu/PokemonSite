import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Pokemon } from '../../interfaces/pokemon';
import { Move } from '../../interfaces/move';
import { DefaultList } from 'src/app/interfaces/defaultList';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private jsonFile = 'assets/data/pokemon_removed.json';

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
    { name: 'All', quantity: 1027, start: 0 },
  ];

  constructor(private http: HttpClient) {}

  getPokedex(): Observable<Pokemon[]> {
    return this.http.get<Pokemon[]>(this.jsonFile);
  }

  getPokemon(id: string): Observable<Pokemon | undefined> {
    return this.http
      .get<Pokemon[]>(this.jsonFile)
      .pipe(
        map((pokemons: Pokemon[]) =>
          pokemons.find((pokemon) => pokemon.id === id)
        )
      );
  }

  getPokemonByName(name: string): Observable<Pokemon | undefined> {
    console.log(name);
    return this.http
      .get<Pokemon[]>(this.jsonFile)
      .pipe(
        map((pokemons: Pokemon[]) =>
          pokemons.find((pokemon) => pokemon.name.toLowerCase() === name)
        )
      );
  }

  getPokemonSpecies(speciesUrl: string): Observable<any> {
    return this.http.get(speciesUrl);
  }

  //get pokemon by ID based on the
  getPokemonById(id: any): Observable<Pokemon> {
    return this.http.get<Pokemon>(id);
  }

  getPokedexList() {
    return this.pokedex;
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

  //get the pokemon and return an array to of pokemon adjusted to handle a battle
  //i.e. changes stats based on level and randomly selects 4 moves within a range selected.
  public getPokemonForBattle(id: string): Observable<Pokemon> {
    //remove all but 4 moves
    //calculate skills based on a selected level
    //add pp to the moves for limits.
    let url = 'https://pokeapi.co/api/v2/pokemon/' + id;
    return this.http.get<Pokemon>(url);
  }

  public buildTeam(selectedLevel: number): Pokemon[] {
    const team: Pokemon[] = [];
    for (let i = 0; i < 6; i++) {
      this.getPokemonById(
        Math.floor(Math.random() * 1025).toString()
      ).subscribe((res: Pokemon) => {
        this.changeMoveset(res, selectedLevel);
        team.push(res);
      });
    }
    console.log(team);
    return team;
  }

  //gets the current move list and limits it based on the users selected level range
  private changeMoveset(pokemon: Pokemon, selectedLevel: number): void {
    pokemon.moves = pokemon.moves.filter(
      (move) =>
        move.version_group_details.at(0)!.level_learned_at < selectedLevel
    );
  }

  //need to reassign stats to the object field after calculations
  private calculateStats(pokemon: Pokemon): void {
    //health stat calculation
    const baseStat = 0;
    const dv = 0;
    const statEXP = 0;
    const level = 0;
    const health =
      ((baseStat + dv) * 2 + (statEXP / 4) * level) / 100 + level + 10;
    //other stat calculation
    const stat = ((baseStat + dv) * 2 + (statEXP / 4) * level) / 100 + 5;
  }
}
