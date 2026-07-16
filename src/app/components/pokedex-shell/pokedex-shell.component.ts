import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { CatalogAbility } from 'src/app/interfaces/ability';
import { BattleMove } from 'src/app/interfaces/move';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { PokedexAccessService } from 'src/app/services/pokedex-access/pokedex-access.service';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';

export interface PokedexNavTab {
  id: string;
  label: string;
  /** Absolute path segment from app root, e.g. '' or 'battle'; null = reserved slot */
  route: string | null;
  exact?: boolean;
  disabled?: boolean;
}

export interface PokedexAbilityDetail {
  name: string;
  isHidden: boolean;
  effect: string;
}

export interface PokedexMoveDetail {
  moveId: number;
  level: number;
  name: string;
  type: string | null;
  power: number | null;
  effect: string;
}

export interface PokedexMoveGroup {
  method: string;
  label: string;
  moves: PokedexMoveDetail[];
}

export interface PokedexEntryDetail {
  pokemon: Pokemon;
  abilities: PokedexAbilityDetail[];
  moveGroups: PokedexMoveGroup[];
}

@Component({
  selector: 'app-pokedex-shell',
  templateUrl: './pokedex-shell.component.html',
  styleUrls: ['./pokedex-shell.component.css'],
  standalone: false,
})
export class PokedexShellComponent implements OnInit {
  isContentExpanded = false;
  isAnimating = false;
  isBattleRoute = false;
  modeLabel = 'Dex';

  readonly selectedPokemon$ = this.pokemonService.selectedPokedexPokemon$;

  readonly selectedEntryDetail$: Observable<PokedexEntryDetail | undefined> =
    this.selectedPokemon$.pipe(
      switchMap((pokemon) => {
        if (!pokemon) {
          return of(undefined);
        }
        return combineLatest([
          this.pokemonService.getAbilitiesCatalog(),
          this.pokemonService.getMovesCatalog(),
        ]).pipe(
          map(([abilitiesCatalog, movesCatalog]) =>
            this.buildEntryDetail(pokemon, abilitiesCatalog.byName, movesCatalog.byId)
          )
        );
      })
    );

  readonly navTabs: PokedexNavTab[] = [
    { id: 'list', label: 'Dex', route: '', exact: true },
    { id: 'battle', label: 'Battle', route: 'battle' },
    { id: 'r3', label: '···', route: null, disabled: true },
    { id: 'r4', label: '···', route: null, disabled: true },
    { id: 'r5', label: '···', route: null, disabled: true },
  ];

  constructor(
    private pokedexAccessService: PokedexAccessService,
    public pokemonService: PokemonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.pokedexAccessService.isPokedexOpened()) {
      this.isContentExpanded = true;
    }

    this.pokedexAccessService.pokedexOpened$.subscribe((opened) => {
      if (opened) {
        this.isContentExpanded = true;
      }
    });

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.syncRouteMode());
    this.syncRouteMode();
  }

  private readonly moveMethodConfig: Array<{ method: string; label: string }> = [
    { method: 'level-up',    label: 'Level Up' },
    { method: 'machine',     label: 'TM / HM' },
    { method: 'egg',         label: 'Egg Moves' },
    { method: 'tutor',       label: 'Move Tutor' },
    { method: 'form-change', label: 'Form Change' },
  ];

  private buildEntryDetail(
    pokemon: Pokemon,
    abilitiesByName: Record<string, CatalogAbility>,
    movesById: Record<string, BattleMove>
  ): PokedexEntryDetail {
    const abilities: PokedexAbilityDetail[] = (pokemon.abilities ?? []).map(
      (entry) => {
        const name = entry.ability?.name ?? '';
        const catalog = abilitiesByName[name];
        return {
          name,
          isHidden: !!entry.is_hidden,
          effect: catalog?.effect ?? '',
        };
      }
    );

    // Group learnset entries by method, deduplicating by moveId.
    // For level-up, keep the highest level seen. For all other methods, level is irrelevant.
    const byMethod = new Map<string, Map<number, number>>();
    for (const learn of pokemon.moves ?? []) {
      if (!byMethod.has(learn.method)) {
        byMethod.set(learn.method, new Map());
      }
      const group = byMethod.get(learn.method)!;
      const existing = group.get(learn.moveId);
      if (existing === undefined || learn.level > existing) {
        group.set(learn.moveId, learn.level);
      }
    }

    const moveGroups: PokedexMoveGroup[] = this.moveMethodConfig
      .filter(({ method }) => byMethod.has(method))
      .map(({ method, label }) => {
        const entries = [...byMethod.get(method)!.entries()];
        const moves: PokedexMoveDetail[] = entries
          .map(([moveId, level]) => {
            const catalog = movesById[String(moveId)];
            return {
              moveId,
              level,
              name: catalog?.name ?? `move-${moveId}`,
              type: catalog?.type ?? null,
              power: catalog?.power ?? null,
              effect: catalog?.effect ?? '',
            };
          })
          .sort(
            method === 'level-up'
              ? (a, b) => a.level - b.level || a.name.localeCompare(b.name)
              : (a, b) => a.name.localeCompare(b.name)
          );
        return { method, label, moves };
      });

    return { pokemon, abilities, moveGroups };
  }

  private syncRouteMode(): void {
    const url = this.router.url;
    this.isBattleRoute = url.includes('/battle');
    this.modeLabel = this.isBattleRoute ? 'Battle' : 'Dex';
  }

  tabRouterLink(tab: PokedexNavTab): string | null {
    if (tab.route === null || tab.disabled) return null;
    return tab.route === '' ? '/' : `/${tab.route}`;
  }

  toggleContentExpanded(): void {
    if (this.isAnimating) return;

    if (!this.isContentExpanded) {
      this.isAnimating = true;
      this.pokedexAccessService.markPokedexOpened();
      setTimeout(() => {
        this.isContentExpanded = true;
        setTimeout(() => {
          this.isAnimating = false;
        }, 550);
      }, 50);
    } else {
      this.isAnimating = true;
      this.isContentExpanded = false;
      setTimeout(() => {
        this.isAnimating = false;
      }, 550);
    }
  }

  closePokedex(): void {
    this.toggleContentExpanded();
  }
}
