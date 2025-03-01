import {
  Component,
  Injectable,
  OnInit,
  Output,
  Input,
  OnDestroy,
} from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { PokemonEntry } from 'src/app/interfaces/pokedex';
import { DefaultList } from 'src/app/interfaces/defaultList';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css'],
})
@Injectable()
export class PokedexComponent implements OnInit, OnDestroy {

  //page controll variables
  isHoveringPokemon: boolean = false;
  isLoading: boolean = true;

  //pass these values through to the next level on the page
  //selected pokedex variable
  @Input() selectedPokedex: string = '';

  //used to control whether to go by the search bar or the standard method
  //more information about the pokemon in the pages.
  @Output() pokemonName: string = 'test';
  pokemon: any[] = [];
  pokedex: Pokemon[] = [];

  pokedexList!: DefaultList;

  isPostClick: boolean = false;
  selectedPokemonList: PokemonEntry[] = [];
  selectedPokemon?: Pokemon;

  //subscription for event listener on search button
  private searchSubscription!: Subscription;
  searchedPokemon = new FormControl('');
  completeList: Pokemon[] = [];
  filteredList: Pokemon[] = [];
  pokeForm!: FormGroup;

  constructor(
    public pokemonService: PokemonService,
    public dialog: MatDialog,
    private fp: FormBuilder
  ) { }

  //initially load the page to the first pokedex (national dex)
  ngOnInit(): void {
    this.pokeForm = this.fp.group({
      searchedPokemon: this.searchedPokemon,
    });
    this.fetchStartingList();
    this.searchSubscription = this.searchedPokemon.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map((searchedPoke) => this.filterPokemon(searchedPoke))
      )
      .subscribe((filteredList) => {
        //this.filteredList = filteredList;
      });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private filterPokemon(searchPokemon: any): Pokemon[] {
    if (!searchPokemon || searchPokemon == '' || searchPokemon == null) {
      return this.filteredList;
    }
    return this.filteredList.filter((item) =>
      item.name.includes(searchPokemon)
    );
  }

  fetchStartingList(): void {
    this.pokemonService.getPokedex().subscribe((pokemonList: Pokemon[]) => {
      this.completeList = pokemonList;
      this.filteredList = this.completeList;
      this.selectedPokemon = this.filteredList[0];
    });
  }

  updateDetailsById(pokemonName: string) {
    this.pokemonService.getPokemon(pokemonName).subscribe((res: any) => {
      this.selectedPokemon = res;
    });
  }

  updateDetailsByName(pokemonName: string) {
    this.pokemonService.getPokemonByName(pokemonName).subscribe((res: any) => {
      this.selectedPokemon = res;
      console.log(res);
    });
  }

  updatePokemon(pokemon: any) {
    this.selectedPokemon = pokemon;
  }

  selectRange(start: number, end: number): typeof this.filteredList {
    if (start < 0 || end >= this.filteredList.length || start > end) {
      throw new Error("Invalid range specified");
    }
    return this.filteredList.slice(start, end + 1);
  }
}
