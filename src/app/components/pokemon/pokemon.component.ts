import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { PokemonService } from 'src/app/services/pokemon.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { PokedexService } from 'src/app/services/pokedex/pokedex.service';
import { PokedexList } from 'src/app/interfaces/pokedexList';

@Component({
  selector: 'app-pokemon',
  templateUrl: './pokemon.component.html',
  styleUrls: ['./pokemon.component.css']
})

//passes through a name of a pokemon from the pokedex component to get detailed information about the
//pokemon based on the button that you pushed.
export class PokemonComponent implements OnInit {
  isLoading: boolean = false;
  @Input() pokemonName2: string = '';
  currentPokemon: any = 0;
  pokemonName: string = '';
  pokemonImgUrl: string = '';

  pokedexList: PokedexList[] = [];

  tableColumns: string[] = ["name", "url"]
  constructor(private pokemonService: PokemonService, private pokedexService: PokedexService, private route: ActivatedRoute) {
    this.runPokemon();
   }
  
  ngOnInit(): void {
  }

  

  runPokemon(): void {
    this.pokemonName = this.route.snapshot.params['pokeNumber'];
    this.pokemonService.getPokemonById(this.pokemonName).subscribe((res: any) => {
      this.isLoading = true;
      this.currentPokemon = res;
      this.isLoading = false;
    });
  }
}
