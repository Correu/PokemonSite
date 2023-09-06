import { Component, OnInit, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { PokemonService } from 'src/app/services/pokemon.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, switchMap } from 'rxjs';

//import { Pokemon } from 'src/app/objects/Pokemon';

@Component({
  selector: 'app-pokemon',
  templateUrl: './pokemon.component.html',
  styleUrls: ['./pokemon.component.css']
})


export class PokemonComponent implements OnInit {
  pokemonName: string = '';
  pokemonImgUrl: string = '';
  //pokemonId!: Observable<Pokemon>;
  constructor(private pokemonService: PokemonService, private route: ActivatedRoute) { }
  
  ngOnInit(): void {
    // this.pokemonId$ = 
    //   this.pokemonService.getPokemon(this.route.id).subscribe(res => {

    //   }));
  }

  getPokemon(id: string) {
    this.pokemonService.getPokemonById(id).subscribe(res => {
      console.log(res);
      this.pokemonName = res.results.name;
    });
  }

}
