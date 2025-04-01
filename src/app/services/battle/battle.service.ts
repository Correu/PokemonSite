import { Injectable } from '@angular/core';
import { PokemonService } from '../pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon'; // Ensure you have a proper model
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BattleService {

  constructor(private pokemonService: PokemonService) { }

  getRandomTeams(): Observable<{ teamA: Pokemon[]; teamB: Pokemon[] }> {
    return this.pokemonService.getPokedex().pipe(
      map((pokedex: Pokemon[]) => {
        const shuffled = this.shuffleArray([...pokedex]);
        const teamA = shuffled.slice(0, 6);
        const teamB = shuffled.slice(6, 12);

        return { teamA, teamB };
      })
    )
  }

  private shuffleArray(array: Pokemon[]): Pokemon[] {
    return array.sort(() => Math.random() - 0.5);
  }


  /** Helper Functions */
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
