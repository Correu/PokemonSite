import { Component, Injectable, OnInit, OnDestroy } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { DefaultList } from 'src/app/interfaces/defaultList';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';

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

  pokedexList!: DefaultList;

  isPostClick: boolean = false;
  selectedPokemon?: Pokemon;

  private searchSubscription!: Subscription;
  searchedPokemon = new FormControl('');
  completeList: Pokemon[] = [];
  filteredList: Pokemon[] = [];
  pokeForm!: FormGroup;

  constructor(
    public pokemonService: PokemonService,
    public dialog: MatDialog,
    private fp: FormBuilder
  ) {}

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
    });
  }

  updatePokemon(pokemon: any) {
    this.selectedPokemon = pokemon;
  }

  selectRange(start: number, count: number): void {
    if (start < 0 || count < 1 || start >= this.completeList.length) {
      throw new Error('Invalid range specified');
    }

    const end = Math.min(start + count, this.completeList.length); // Ensure it doesn't exceed the list length
    this.filteredList = this.completeList.slice(start, end);
    this.selectedPokemon = this.filteredList[0];
  }

  getPokemonForGeneration(generation: any): Pokemon[] {
    if (!this.completeList || this.completeList.length === 0) {
      return [];
    }

    const start = generation.start;
    const count = generation.quantity;
    const end = Math.min(start + count, this.completeList.length);

    return this.completeList.slice(start, end);
  }

  openDialog() {
    this.dialog.open(PokemonDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: { pokemon: this.selectedPokemon },
    });
  }
}
