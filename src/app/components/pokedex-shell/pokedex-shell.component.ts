import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
<<<<<<< HEAD
import { filter } from 'rxjs/operators';
=======
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
>>>>>>> c66908abf8ca8ebf750579da5fe8e85f4268035e
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
  isBattleRoute = false;
  modeLabel = 'Dex';

  readonly selectedPokemon$ = this.pokemonService.selectedPokedexPokemon$;
  readonly isBattleRoute$: Observable<boolean>;

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
<<<<<<< HEAD
  ) {}
=======
  ) {
    this.isBattleRoute$ = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.includes('/battle')),
      startWith(this.router.url.includes('/battle'))
    );
  }
>>>>>>> c66908abf8ca8ebf750579da5fe8e85f4268035e

  ngOnInit(): void {
    if (this.pokedexAccessService.isPokedexOpened()) {
      this.isContentExpanded = true;
    }
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.syncRouteMode());
    this.syncRouteMode();
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
