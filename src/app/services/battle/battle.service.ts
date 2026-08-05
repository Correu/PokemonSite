import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PokemonService } from '../pokemon/pokemon.service';
import { Pokemon, PokemonLearnsetMove } from 'src/app/interfaces/pokemon';
import { BattleBattler, BattleConfig, GEN1_POKEMON_COUNT } from 'src/app/interfaces/battle';
import {
  BattleCombatBattler,
  BattleCombatMove,
} from 'src/app/interfaces/battle-event';
import { BattleMove, MovesCatalog } from 'src/app/interfaces/move';

interface NormalizedLearnsetEntry {
  moveId: number;
  level: number;
  method: string;
}

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  private static readonly PREFERRED_VERSION_GROUP = 'scarlet-violet';

  constructor(private pokemonService: PokemonService) {}

  async buildTeam(config: BattleConfig): Promise<Pokemon[]> {
    const pokedex = await firstValueFrom(this.pokemonService.getPokedex());
    const pool = pokedex.filter((p) => Number(p.id) <= GEN1_POKEMON_COUNT);
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

  async buildCombatTeam(
    team: Pokemon[],
    level: number,
    selectedMovesByPokemon: Record<string, number[]> = {}
  ): Promise<BattleCombatBattler[]> {
    const catalog = await firstValueFrom(this.pokemonService.getMovesCatalog());
    return team.map((pokemon) => {
      const selected = selectedMovesByPokemon[String(pokemon.id)];
      return this.toCombatBattler(pokemon, level, catalog, selected);
    });
  }

  getEligibleMoveIds(
    pokemon: Pokemon,
    level: number,
    catalog: MovesCatalog
  ): number[] {
    const entries = this.normalizeLearnset(pokemon);
    const levelUp: NormalizedLearnsetEntry[] = [];
    const other: NormalizedLearnsetEntry[] = [];

    for (const entry of entries) {
      if (!catalog.byId[String(entry.moveId)]) {
        continue;
      }
      if (entry.method === 'level-up') {
        if (entry.level <= level) {
          levelUp.push(entry);
        }
      } else {
        other.push(entry);
      }
    }

    levelUp.sort((a, b) => a.level - b.level || a.moveId - b.moveId);
    other.sort((a, b) => a.moveId - b.moveId);

    const ids: number[] = [];
    for (const entry of [...levelUp, ...other]) {
      if (!ids.includes(entry.moveId)) {
        ids.push(entry.moveId);
      }
    }
    return ids;
  }

  getEligibleMoves(
    pokemon: Pokemon,
    level: number,
    catalog: MovesCatalog
  ): BattleMove[] {
    return this.getEligibleMoveIds(pokemon, level, catalog)
      .map((id) => catalog.byId[String(id)])
      .filter((m): m is BattleMove => !!m);
  }

  toCombatBattler(
    pokemon: Pokemon,
    level: number,
    catalog: MovesCatalog,
    selectedMoveIds?: number[]
  ): BattleCombatBattler {
    const base = this.createBattler(pokemon, level);
    const moveIds = this.resolveMoveIds(pokemon, level, catalog, selectedMoveIds);

    const moves = moveIds
      .map((id) => catalog.byId[String(id)])
      .filter((m): m is BattleMove => !!m)
      .map((m) => this.toCombatMove(m));

    if (moves.length === 0) {
      const fallback = catalog.byId['1'] ?? catalog.byId['33'];
      if (fallback) {
        moves.push(this.toCombatMove(fallback));
      }
    }

    return {
      speciesId: base.speciesId,
      name: base.name,
      displayName: base.displayName,
      level: base.level,
      maxHp: base.maxHp,
      currentHp: base.currentHp,
      frontSprite: base.frontSprite,
      backSprite: base.backSprite,
      isFainted: false,
      types: pokemon.types.map(t => t.type.name),
      stats: this.extractStats(pokemon, level),
      moves,
    };
  }

  /** Up to 4 moves; uses player selection when provided, else all eligible moves available. */
  resolveMoveIds(
    pokemon: Pokemon,
    level: number,
    catalog: MovesCatalog,
    selectedMoveIds?: number[]
  ): number[] {
    const eligibleIds = this.getEligibleMoveIds(pokemon, level, catalog);
    const maxMoves = Math.min(4, eligibleIds.length);

    if (selectedMoveIds?.length) {
      const valid = selectedMoveIds.filter((id) => eligibleIds.includes(id));
      if (valid.length > 0) {
        return valid.slice(0, maxMoves || 4);
      }
    }

    return eligibleIds.slice(0, 4);
  }

  maxSelectableMoves(pokemon: Pokemon, level: number, catalog: MovesCatalog): number {
    return Math.min(4, this.getEligibleMoveIds(pokemon, level, catalog).length);
  }

  toCombatMove(move: BattleMove): BattleCombatMove {
    const maxPp = move.pp ?? 5;
    return {
      id: move.id,
      name: move.name,
      power: move.power,
      type: move.type,
      damageClass: move.damageClass,
      priority: move.priority,
      maxPp,
      currentPp: maxPp,
    };
  }

  private pickMoveIds(
    pokemon: Pokemon,
    level: number,
    catalog: MovesCatalog
  ): number[] {
    return this.getEligibleMoveIds(pokemon, level, catalog).slice(0, 4);
  }

  private normalizeLearnset(pokemon: Pokemon): NormalizedLearnsetEntry[] {
    const raw = pokemon.moves ?? [];
    if (raw.length === 0) {
      return [];
    }

    const first = raw[0] as PokemonLearnsetMove & {
      move?: { url?: string };
      version_group_details?: Array<{
        level_learned_at?: number;
        move_learn_method?: { name?: string };
        version_group?: { name?: string };
      }>;
    };

    if (first.moveId) {
      return raw
        .map((entry) => {
          const slim = entry as PokemonLearnsetMove;
          return {
            moveId: slim.moveId,
            level: slim.level ?? 0,
            method: slim.method ?? 'level-up',
          };
        })
        .filter((e) => e.moveId > 0);
    }

    if (first.move?.url || first.version_group_details) {
      return this.normalizePokeApiLearnset(
        raw as Array<{
          move?: { url?: string };
          version_group_details?: Array<{
            level_learned_at?: number;
            move_learn_method?: { name?: string };
            version_group?: { name?: string };
          }>;
        }>
      );
    }

    return [];
  }

  private normalizePokeApiLearnset(
    raw: Array<{
      move?: { url?: string };
      version_group_details?: Array<{
        level_learned_at?: number;
        move_learn_method?: { name?: string };
        version_group?: { name?: string };
      }>;
    }>
  ): NormalizedLearnsetEntry[] {
    const entries: NormalizedLearnsetEntry[] = [];
    const seen = new Set<string>();

    for (const moveEntry of raw) {
      const moveId = this.parseMoveIdFromUrl(moveEntry.move?.url ?? '');
      if (!moveId) {
        continue;
      }

      const byMethod = new Map<
        string,
        Array<{ level: number; versionGroup: string }>
      >();

      for (const detail of moveEntry.version_group_details ?? []) {
        const method = detail.move_learn_method?.name;
        if (!method) {
          continue;
        }
        const level = detail.level_learned_at ?? 0;
        const versionGroup = detail.version_group?.name ?? '';
        const list = byMethod.get(method) ?? [];
        list.push({ level, versionGroup });
        byMethod.set(method, list);
      }

      for (const [method, rows] of byMethod) {
        const preferred = rows.find(
          (r) => r.versionGroup === BattleService.PREFERRED_VERSION_GROUP
        );
        const chosen =
          preferred ??
          (method === 'level-up'
            ? [...rows].sort((a, b) => a.level - b.level)[0]
            : rows[0]);
        if (!chosen) {
          continue;
        }

        const key = `${moveId}:${method}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        entries.push({
          moveId,
          level: chosen.level,
          method,
        });
      }
    }

    return entries;
  }

  private parseMoveIdFromUrl(url: string): number | null {
    const match = url.match(/\/move\/(\d+)\/?$/);
    if (!match?.[1]) {
      return null;
    }
    const id = parseInt(match[1], 10);
    return Number.isFinite(id) ? id : null;
  }

  private rollDv(): number {
    return Math.floor(Math.random() * 16); // 0–15
  }

  private extractStats(pokemon: Pokemon, level: number) {
    const base = (name: string) =>
      pokemon.stats.find((s) => s.stat.name === name)?.base_stat ?? 50;

    const scaleStat = (b: number) =>
      Math.max(1, Math.floor(((b + this.rollDv()) * 2 * level) / 100) + 5);

    return {
      attack:         scaleStat(base('attack')),
      defense:        scaleStat(base('defense')),
      specialAttack:  scaleStat(base('special-attack')),
      specialDefense: scaleStat(base('special-defense')),
      speed:          scaleStat(base('speed')),
    };
  }

  private calculateMaxHp(pokemon: Pokemon, level: number): number {
    const b = pokemon.stats.find((s) => s.stat.name === 'hp')?.base_stat ?? 50;
    return Math.floor(((b + this.rollDv()) * 2 * level) / 100) + level + 10;
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
