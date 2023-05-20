import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class PokemonServiceService {

  constructor(private http:HttpClient) { }

  //returns pokemon by name
  public getPokemon(name:string): Observable<any> {
    return this.http.get(name);
  }

  public getPokemonById(id: string): Observable<any> {
    let url = 'https://pokeapi.co/api/v2/pokemon/' + id;
    console.log(url);
    return this.http.get(url);
  }

  //returns list of all pokemon
  public getPokedex(): Observable<any> {
    let url = 'https://pokeapi.co/api/v2/pokemon/?limit=100';
    return this.http.get(url);
  }
}
