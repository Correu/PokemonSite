import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
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

@Component({
  selector: 'app-pokedex-shell',
  templateUrl: './pokedex-shell.component.html',
  styleUrls: ['./pokedex-shell.component.css'],
  standalone: false,
})
export class PokedexShellComponent implements OnInit {
  isContentExpanded = false;
  isAnimating = false;

  readonly selectedPokemon$ = this.pokemonService.selectedPokedexPokemon$;
  readonly isBattleRoute$: Observable<boolean>;

  readonly navTabs: PokedexNavTab[] = [
    { id: 'list', label: 'List', route: '', exact: true },
    { id: 'battle', label: 'Battle', route: 'battle' },
    { id: 'r3', label: '···', route: null, disabled: true },
    { id: 'r4', label: '···', route: null, disabled: true },
    { id: 'r5', label: '···', route: null, disabled: true },
    { id: 'r6', label: '···', route: null, disabled: true },
    { id: 'r7', label: '···', route: null, disabled: true },
    { id: 'r8', label: '···', route: null, disabled: true },
    { id: 'r9', label: '···', route: null, disabled: true },
    { id: 'r10', label: '···', route: null, disabled: true },
  ];

  constructor(
    private pokedexAccessService: PokedexAccessService,
    public pokemonService: PokemonService,
    private router: Router
  ) {
    this.isBattleRoute$ = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.includes('/battle')),
      startWith(this.router.url.includes('/battle'))
    );
  }

  ngOnInit(): void {
    if (this.pokedexAccessService.isPokedexOpened()) {
      this.isContentExpanded = true;
    }
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
