import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Item } from 'src/app/interfaces/item';

@Injectable({
  providedIn: 'root'
})
export class ItemService {

  constructor(private http:HttpClient) { }

  public getItem(): Observable<Item> {
    let url  = 'https://pokeapi.co/api/v2/item/1';
    return this.http.get<Item>(url);
  }
}
