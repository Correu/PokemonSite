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
    let url = '';
    return this.http.get(url);
  }
}
