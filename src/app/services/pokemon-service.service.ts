import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PokemonServiceService {

  constructor(private http:HttpClient) { }

  //returns pokemon by name
  //currently defaults to hit id 1
  public getPokemon(name:string): Observable<any> {
    let url = 'https://pokeapi.co/api/v2/pokemon/1';
    return this.http.get(url);
  }
}
