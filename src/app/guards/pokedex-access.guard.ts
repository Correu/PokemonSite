import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PokedexAccessService } from '../services/pokedex-access/pokedex-access.service';

@Injectable({
  providedIn: 'root'
})
export class PokedexAccessGuard implements CanActivate {
  constructor(
    private pokedexAccessService: PokedexAccessService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const joinIntent = !!route.queryParamMap.get('join')?.trim();

    if (joinIntent && !this.pokedexAccessService.isPokedexOpened()) {
      this.pokedexAccessService.markPokedexOpened();
    }

    if (this.pokedexAccessService.isPokedexOpened() || joinIntent) {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}


