import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Pokemon } from '../../interfaces/pokemon';
import { Move } from '../../interfaces/move';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  //battle page boolean
  battleLoad!: boolean;
  //pokedex page boolean
  pokedexLoad!: boolean;

  pokemonIds: PokeIds[] = [];
  pokedex: Pokemon[] = [];

  playerTeam: Pokemon[] = [];
  enemyTeam: Pokemon[] = [];

  constructor(private http: HttpClient) {}

  //returns original data from the endpoints
  public getPokemonById(id: string): Observable<Pokemon> {
    let url = 'https://pokeapi.co/api/v2/pokemon/' + id;
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

  //initially loads to kanto pokedex
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

  public getMove(name: string): Observable<Move> {
    let url = 'https://pokeapi.co/api/v2/move/' + name;
    return this.http.get<Move>(url);
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

type PokeIds = {
  name: string;
  url: string;
};
