import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PokemonService } from '../pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { BattleBattler, BattleConfig } from 'src/app/interfaces/battle';

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  constructor(private pokemonService: PokemonService) {}

  async buildTeam(config: BattleConfig): Promise<Pokemon[]> {
    const pokedex = await firstValueFrom(this.pokemonService.getPokedex());
    let pool = [...pokedex];

    if (config.generation != null) {
      pool = pool.filter(
        (p) => this.generationFromId(Number(p.id)) === config.generation,
      );
    }

    const shuffled = this.shuffleArray(pool);
    return shuffled.slice(0, config.teamSize);
  }

  createBattler(pokemon: Pokemon, level: number): BattleBattler {
    const maxHp = this.calculateMaxHp(pokemon, level);

    return {
      speciesId: String(pokemon.id),
      name: pokemon.name,
      displayName: this.capitalize(pokemon.name),
      level,
      currentHp: maxHp,
      maxHp,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      frontSprite: pokemon.sprites.front_default,
      backSprite: pokemon.sprites.back_default || pokemon.sprites.front_default,
      isFainted: false,
    };
  }

  private calculateMaxHp(pokemon: Pokemon, level: number): number {
    const hpStat =
      pokemon.stats.find((s) => s.stat.name === 'hp')?.base_stat ?? 50;
    return Math.floor((2 * hpStat * level) / 100 + level + 10);
  }

  private generationFromId(id: number): number {
    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    if (id <= 809) return 7;
    if (id <= 905) return 8;
    return 9;
  }

  private capitalize(value: string): string {
    return value
      .split(/[\s-]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy;
  }
}
