import { Component, Injectable, OnInit, Output, Input, ViewEncapsulation } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { PokedexService } from 'src/app/services/pokedex/pokedex.service';
import { PokemonEntry } from 'src/app/interfaces/pokedex';
import { DefaultList } from 'src/app/interfaces/defaultList';
import { PokedexInstructionDialogComponent } from 'src/app/dialogs/pokedex-instruction-dialog/pokedex-instruction-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css'],
  // encapsulation: ViewEncapsulation.None
})

@Injectable()
export class PokedexComponent implements OnInit {

  //page controll variables
  isHoveringPokemon: boolean = false;
  isLoading: boolean = true;

  background: string = "kanto";


  //pass these values through to the next level on the page
  //selected pokedex variable
  @Input() selectedPokedex: string = '';

  //more information about the pokemon in the pages.
  @Output() pokemonName: string = 'test';
  pokemon: any[] = [];
  pokemonList: PokeIds[] = [];
  pokedex: Pokemon[] = [];

  pokedexList!: DefaultList;

  isPostClick: boolean = false;
  selectedPokemonList: PokemonEntry[] = [];
  selectedPokemon: any = this.pokemonService.getPokemonById('bulbasaur').subscribe((res: any) => {
    this.selectedPokemon = res;
  });

  constructor(public pokemonService: PokemonService, public pokedexService: PokedexService, public dialog: MatDialog) { }

  //initially load the page to the first pokedex (national dex)
  ngOnInit(): void {
    if (!this.pokemonService.pokedexLoad) {
      this.instructionDialog();
    }
    this.getPokedexList();
    this.getPokemonList();
  }

  private instructionDialog() {
    const dialogRef = this.dialog.open(PokedexInstructionDialogComponent);
    this.pokemonService.pokedexLoad = true;
  }

  setBackground(): void {
    this.isHoveringPokemon = !this.isHoveringPokemon
  }

  getPokedexList(): void {
    this.pokedexService.getPokedexList().subscribe((res: any) => {
      this.isLoading = true;
      this.pokedexList = res;
      this.isLoading = false;
    })
  }

  getPokemonList(): void {
    this.pokemonService.getPokedex().subscribe((res: any) => {
      this.pokemonList = res.results;
    });
    this.pokedex = this.pokemonService.pokedex;
  }

  getSpecificPokedex(specificPokedex: string): void {
    this.isPostClick = true;
    this.pokedexService.getIndividualPokdex(specificPokedex).subscribe((res: any) => {
      //this.pokedexList = res.results;
      console.log(res.pokemon_entries);
      this.selectedPokemonList = res.pokemon_entries;
    });
  }

  updateViewingPokemon(pokemonName: string) {
    this.pokemonService.getPokemonById(pokemonName).subscribe((res: any) => {
      this.selectedPokemon = res;
    })
    //this.pokemonName = pokemonName;
  }
}
type PokeIds = {
  name: string,
  url: string;
}