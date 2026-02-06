import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PokedexAccessService {
  private pokedexOpenedSubject = new BehaviorSubject<boolean>(false);
  public pokedexOpened$: Observable<boolean> = this.pokedexOpenedSubject.asObservable();

  constructor() {
    // Check if pokedex was previously opened (persist across page refreshes)
    const savedState = localStorage.getItem('pokedexOpened');
    if (savedState === 'true') {
      this.pokedexOpenedSubject.next(true);
    }
  }

  /**
   * Mark the pokedex as opened (user has interacted with it)
   */
  markPokedexOpened(): void {
    this.pokedexOpenedSubject.next(true);
    localStorage.setItem('pokedexOpened', 'true');
  }

  /**
   * Check if pokedex has been opened
   */
  isPokedexOpened(): boolean {
    return this.pokedexOpenedSubject.value;
  }

  /**
   * Reset the pokedex access (useful for testing or logout)
   */
  resetPokedexAccess(): void {
    this.pokedexOpenedSubject.next(false);
    localStorage.removeItem('pokedexOpened');
  }
}


