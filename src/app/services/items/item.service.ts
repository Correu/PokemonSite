import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Item } from 'src/app/interfaces/item';
import { BattleItemType } from 'src/app/interfaces/battle-event';
import { map, catchError, tap } from 'rxjs/operators';

const HEALING_CATEGORIES = new Set([
  'healing',
  'medicine',
  'pp-recovery',
  'revival',
  'status-cures',
]);

const STAT_CATEGORIES = new Set(['stat-boosts', 'vitamins', 'species-specific']);

const BATTLE_ITEM_ID_MAX = 126;
const EXCLUDED_ITEM_NAMES = new Set(['cheri-berry']);

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private url = 'assets/data/items.json';
  private battleCatalogCache: Item[] | null = null;

  constructor(private http: HttpClient) {}

  public getItem(): Observable<Item> {
    return this.http.get<Item>(this.url);
  }

  getItemBattleType(item: Item): BattleItemType | null {
    const category = item.category?.name ?? '';
    if (HEALING_CATEGORIES.has(category)) {
      return 'healing';
    }
    if (STAT_CATEGORIES.has(category)) {
      return 'stat';
    }
    return null;
  }

  isHoldable(item: Item): boolean {
    return (item.attributes ?? []).some((a) => a.name === 'holdable');
  }

  isBattleCatalogItem(item: Item): boolean {
    return (
      item.id <= BATTLE_ITEM_ID_MAX &&
      !EXCLUDED_ITEM_NAMES.has(item.name) &&
      this.getItemBattleType(item) !== null
    );
  }

  getBattleCatalog(): Observable<Item[]> {
    if (this.battleCatalogCache) {
      return of(this.battleCatalogCache);
    }

    return this.loadAllItems().pipe(
      map((items) =>
        items
          .filter((item) => this.isBattleCatalogItem(item))
          .sort((a, b) => a.id - b.id)
      ),
      tap((items) => {
        this.battleCatalogCache = items;
      }),
      catchError((error) => {
        console.error('Error loading battle item catalog:', error);
        return of([]);
      })
    );
  }

  getBattleItemsByTypes(types: BattleItemType[]): Observable<Item[]> {
    const allowed = new Set(types);
    return this.getBattleCatalog().pipe(
      map((items) =>
        items.filter((item) => {
          const battleType = this.getItemBattleType(item);
          return battleType !== null && allowed.has(battleType);
        })
      )
    );
  }

  getItemById(id: number): Observable<Item | undefined> {
    return this.getBattleCatalog().pipe(
      map((items) => items.find((item) => item.id === id))
    );
  }

  /** @deprecated Use getBattleCatalog / getBattleItemsByTypes */
  public getRandomItems(): Observable<Item[]> {
    return this.getBattleCatalog().pipe(
      map((items) => {
        const shuffled = [...items].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(30, shuffled.length));
      })
    );
  }

  private loadAllItems(): Observable<Item[]> {
    return this.http.get<unknown>(this.url).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response as Item[];
        }
        if (
          response &&
          typeof response === 'object' &&
          'results' in response &&
          Array.isArray((response as { results: Item[] }).results)
        ) {
          return (response as { results: Item[] }).results;
        }
        if (response && typeof response === 'object' && 'id' in response) {
          return [response as Item];
        }
        return [];
      })
    );
  }
}
