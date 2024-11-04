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
import { PokedexService } from 'src/app/services/pokedex/pokedex.service';
import { PokemonEntry } from 'src/app/interfaces/pokedex';
import { DefaultList } from 'src/app/interfaces/defaultList';
import { PokedexInstructionDialogComponent } from 'src/app/dialogs/pokedex-instruction-dialog/pokedex-instruction-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css'],
  // encapsulation: ViewEncapsulation.None
})
@Injectable()
export class PokedexComponent implements OnInit, OnDestroy {
  //page controll variables
  isHoveringPokemon: boolean = false;
  isLoading: boolean = true;

  background: string = 'kanto';

  //pass these values through to the next level on the page
  //selected pokedex variable
  @Input() selectedPokedex: string = '';

  //used to control whether to go by the search bar or the standard method
  //more information about the pokemon in the pages.
  @Output() pokemonName: string = 'test';
  pokemon: any[] = [];
  pokemonList: PokeIds[] = [];
  pokedex: Pokemon[] = [];

  pokedexList!: DefaultList;

  isPostClick: boolean = false;
  selectedPokemonList: PokemonEntry[] = [];
  selectedPokemon: any = this.pokemonService
    .getPokemonById('bulbasaur')
    .subscribe((res: any) => {
      this.selectedPokemon = res;
    });

  //subscription for event listener on search button
  private searchSubscription!: Subscription;
  searchedPokemon = new FormControl('');
  filteredList: PokeIds[] = [];
  pokeForm!: FormGroup;

  constructor(
    public pokemonService: PokemonService,
    public pokedexService: PokedexService,
    public dialog: MatDialog
  ) {}

  //initially load the page to the first pokedex (national dex)
  ngOnInit(): void {
    if (!this.pokemonService.pokedexLoad) {
      this.instructionDialog();
    }
    this.getPokedexList();
    this.getPokemonList();

    this.searchSubscription = this.searchedPokemon.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map((searchedPoke) => this.filterPokemon(searchedPoke))
      )
      .subscribe((filteredList) => {
        this.filteredList = filteredList;
      });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private filterPokemon(searchPokemon: any): PokeIds[] {
    if (!searchPokemon || searchPokemon == '' || searchPokemon == null) {
      return this.pokemonList;
    }
    return this.pokemonList.filter((item) => item.name.includes(searchPokemon));
  }

  private instructionDialog() {
    const dialogRef = this.dialog.open(PokedexInstructionDialogComponent);
    this.pokemonService.pokedexLoad = true;
  }

  setBackground(): void {
    this.isHoveringPokemon = !this.isHoveringPokemon;
  }

  getPokedexList(): void {
    this.pokedexService.getPokedexList().subscribe((res: any) => {
      this.isLoading = true;
      this.pokedexList = res;
      this.isLoading = false;
    });
  }

  getPokemonList(): void {
    this.pokemonService.getPokedex().subscribe((res: any) => {
      this.pokemonList = res.results;
    });
    this.pokedex = this.pokemonService.pokedex;
  }

  getSpecificPokedex(specificPokedex: string): void {
    //this.isPostClick = true;
    this.pokedexService
      .getIndividualPokdex(specificPokedex)
      .subscribe((res: any) => {
        //this.pokedexList = res.results;
        console.log(res.pokemon_entries);
        this.selectedPokemonList = res.pokemon_entries;
      });
  }

  updateViewingPokemon(pokemonName: string) {
    this.pokemonService.getPokemonById(pokemonName).subscribe((res: any) => {
      this.selectedPokemon = res;
    });
  }
}
type PokeIds = {
  name: string;
  url: string;
};
