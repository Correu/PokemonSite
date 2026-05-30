import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PokemonService } from '../pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';
import {
  BattleBattler,
  BattleConfig,
  BattleMoveSlot,
} from 'src/app/interfaces/battle';

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  constructor(private pokemonService: PokemonService) {}

  async buildTeam(config: BattleConfig): Promise<Pokemon[]> {
    const pokedex = await firstValueFrom(this.pokemonService.getPokedex());
    let pool = [...pokedex];

    if (config.generation != null) {
      pool = pool.filter((p) => this.generationFromId(Number(p.id)) === config.generation);
    }

    const shuffled = this.shuffleArray(pool);
    return shuffled.slice(0, config.teamSize);
  }

  createBattler(pokemon: Pokemon, level: number): BattleBattler {
    const maxHp = this.calculateMaxHp(pokemon, level);
    const moves = this.buildMoveSlots(pokemon, level);

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
      moves,
      isFainted: false,
    };
  }

<<<<<<< HEAD
  applyMoveDamage(attacker: BattleBattler, defender: BattleBattler, moveIndex: number): number {
    const move = attacker.moves[moveIndex];
    if (!move || move.pp <= 0) {
      return 0;
    }
    move.pp = Math.max(0, move.pp - 1);
    const damage = Math.max(1, Math.floor(attacker.level * 0.4 + Math.random() * 20));
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    if (defender.currentHp === 0) {
      defender.isFainted = true;
    }
    return damage;
=======
  /** Helper Functions */
  //gets the current move list and limits it based on the users selected level range
  private changeMoveset(pokemon: Pokemon, selectedLevel: number): void {
    pokemon.moves = pokemon.moves.filter((move) => move.level <= selectedLevel);
>>>>>>> 5883c18d2539c58b2d2b52b4aedc19cb59bcf4f1
  }

  private buildMoveSlots(pokemon: Pokemon, level: number): BattleMoveSlot[] {
    const eligible = pokemon.moves
      .filter((entry) => {
        const detail = entry.version_group_details[0];
        return detail && detail.level_learned_at <= level;
      })
      .slice(0, 4);

    const fallbackNames = ['Tackle', 'Growl', 'Scratch', 'Leer'];
    const slots: BattleMoveSlot[] = eligible.map((entry) => ({
      name: this.capitalize(entry.move.name.replace(/-/g, ' ')),
      pp: 20,
      maxPp: 20,
    }));

    while (slots.length < 4) {
      slots.push({
        name: fallbackNames[slots.length] ?? 'Struggle',
        pp: 20,
        maxPp: 20,
      });
    }

    return slots.slice(0, 4);
  }

  private calculateMaxHp(pokemon: Pokemon, level: number): number {
    const hpStat =
      pokemon.stats.find((s) => s.stat.name === 'hp')?.base_stat ?? 50;
    return Math.floor(((2 * hpStat * level) / 100) + level + 10);
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
