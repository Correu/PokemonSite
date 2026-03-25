import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PokedexAccessService {
  private pokedexOpenedSubject = new BehaviorSubject<boolean>(false);
  public pokedexOpened$: Observable<boolean> =
    this.pokedexOpenedSubject.asObservable();

  constructor() {
    const savedState = localStorage.getItem('pokedexOpened');
    if (savedState === 'true') {
      this.pokedexOpenedSubject.next(true);
    }
  }

  markPokedexOpened(): void {
    this.pokedexOpenedSubject.next(true);
    localStorage.setItem('pokedexOpened', 'true');
  }

  isPokedexOpened(): boolean {
    return this.pokedexOpenedSubject.value;
  }

  resetPokedexAccess(): void {
    this.pokedexOpenedSubject.next(false);
    localStorage.removeItem('pokedexOpened');
  }
}
