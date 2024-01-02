import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

//contains the api endpoints to simulate an encounter
//ranges from locations to physical encounters
export class EncounterService {

  constructor(private http:HttpClient) { }

  //returns all avaliable locations.
  public getLocation(): Observable<any> {
    let url = "https://pokeapi.co/api/v2/location?limit=851";
    return this.http.get<any>(url);
  }

  //get list of location-areas
  public getLocationAreas(): Observable<any> {
     let url = "https://pokeapi.co/api/v2/location-area";
     return this.http.get<any>(url);
  }
}
