import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pokedex } from 'src/app/interfaces/pokedex';
import { DefaultList } from 'src/app/interfaces/defaultList';

@Injectable({
  providedIn: 'root',
})
export class PokedexService {
  constructor(private http: HttpClient) {}

  //get default kanto dex
  public getPokedex(): Observable<PokeIds[]> {
    let url = 'https://pokeapi.co/api/v2/pokemon/?limit=151';
    return this.http.get<PokeIds[]>(url);
  }

  //get list of pokedexs
  public getPokedexList(): Observable<DefaultList> {
    let url = 'https://pokeapi.co/api/v2/pokedex/';
    return this.http.get<DefaultList>(url);
  }

  public getIndividualPokedex(range: string, offset: string): void {}

  public getIndividualPokdex(pokedex: string): Observable<Pokedex> {
    let url = 'https://pokeapi.co/api/v2/pokedex/' + pokedex;
    return this.http.get<Pokedex>(url);
  }
}

type PokeIds = {
  name: string;
  url: string;
};
