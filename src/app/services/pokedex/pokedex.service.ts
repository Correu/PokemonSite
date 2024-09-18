import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pokedex } from 'src/app/interfaces/pokedex';
import { DefaultList } from 'src/app/interfaces/defaultList';

@Injectable({
  providedIn: 'root'
})
export class PokedexService {

  constructor(private http:HttpClient) { }

  //get list of pokedexs
  public getPokedexList(): Observable<DefaultList> {
    let url = 'https://pokeapi.co/api/v2/pokedex/';
    return this.http.get<DefaultList>(url);
  }

  public getSpecificPokedex(range: string, offset: string): void {
    
  }

  public getIndividualPokdex(pokedex:string): Observable<Pokedex> {
    let url = 'https://pokeapi.co/api/v2/pokedex/' + pokedex;
    return this.http.get<Pokedex>(url);
  }
}
