import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Item } from 'src/app/interfaces/item';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private url = 'assets/data/items.json';

  constructor(private http: HttpClient) {}

  public getItem(): Observable<Item> {
    return this.http.get<Item>(this.url);
  }

  /**
   * Fetches 30 random items from the local items.json file
   * @returns Observable of an array of 30 random Item objects
   */
  public getRandomItems(): Observable<Item[]> {
    return this.http.get<any>(this.url).pipe(
      map((response) => {
        // Handle different possible response formats
        let items: Item[] = [];

        // If response is an array, use it directly
        if (Array.isArray(response)) {
          items = response;
        }
        // If response has a 'results' property that's an array, use that
        else if (response.results && Array.isArray(response.results)) {
          items = response.results;
        }
        // If response is a single item, wrap it in an array
        else if (response.id) {
          items = [response];
        }

        // Ensure we have items to work with
        if (items.length === 0) {
          console.warn('No items found in the response');
          return [];
        }

        // Shuffle the array using Fisher-Yates algorithm
        const shuffled = [...items].sort(() => 0.5 - Math.random());
        // Return the first 30 items (or fewer if less than 30 are available)
        return shuffled.slice(0, Math.min(30, shuffled.length));
      }),
      catchError((error) => {
        console.error('Error fetching random items:', error);
        return of([]);
      })
    );
  }
}
