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
    if (this.pokedexAccessService.isPokedexOpened()) {
      return true;
    } else {
      // Redirect to pokedex if not opened yet
      this.router.navigate(['/']);
      return false;
    }
  }
}


