import {
  Component,
  Injectable,
  Inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { DefaultList } from 'src/app/interfaces/defaultList';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css'],
  standalone: false,
})
@Injectable()
export class PokedexComponent implements OnInit, OnDestroy {
  private setSelectedPokemon(pokemon: Pokemon | undefined): void {
    this.selectedPokemon = pokemon;
    this.pokemonService.setPokedexSelection(pokemon);
  }

  isLoading: boolean = true;

  pokedexList!: DefaultList;

  isPostClick: boolean = false;
  selectedPokemon?: Pokemon;

  private searchSubscription!: Subscription;
  searchedPokemon = new FormControl('');
  completeList: Pokemon[] = [];
  filteredList: Pokemon[] = [];
  pokeForm!: FormGroup;

  selectedTypes: string[] = [];
  selectedGeneration: string = '';
  searchTerm: string = '';
  availableTypes: string[] = [];

  displayedList: Pokemon[] = [];
  itemsPerPage: number = 20;
  currentPage: number = 1;
  hasMoreItems: boolean = true;

  constructor(
    public pokemonService: PokemonService,
    public dialog: MatDialog,
    @Inject(FormBuilder) private fp: FormBuilder
  ) {}

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
      .subscribe(() => {});
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
      this.setSelectedPokemon(this.filteredList[0]);
      this.extractAvailableTypes();
      this.initializePagination();
    });
  }

  private extractAvailableTypes(): void {
    const typesSet = new Set<string>();
    this.completeList.forEach((pokemon) => {
      if (pokemon.types) {
        pokemon.types.forEach((type) => {
          if (type.type && type.type.name) {
            typesSet.add(type.type.name);
          }
        });
      }
    });
    this.availableTypes = Array.from(typesSet).sort();
  }

  onTypeChange(types: string[]): void {
    this.selectedTypes = types;
    this.applyFilters();
  }

  onGenerationChange(generation: string): void {
    this.selectedGeneration = generation;
    this.applyFilters();
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.completeList];

    if (this.selectedTypes.length > 0) {
      filtered = filtered.filter((pokemon) => {
        if (!pokemon.types) return false;

        const pokemonTypeNames = pokemon.types
          .map((type) => type.type?.name)
          .filter((name) => name !== undefined) as string[];

        return this.selectedTypes.every((selectedType) =>
          pokemonTypeNames.includes(selectedType)
        );
      });
    }

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pokemon) =>
          pokemon.name.toLowerCase().includes(searchLower) ||
          pokemon.id.toString().includes(searchLower)
      );
    }

    this.filteredList = filtered;
    this.initializePagination();
  }

  private initializePagination(): void {
    this.currentPage = 1;
    this.updateDisplayedList();
  }

  private updateDisplayedList(): void {
    const endIndex = this.currentPage * this.itemsPerPage;
    this.displayedList = this.filteredList.slice(0, endIndex);
    this.hasMoreItems = endIndex < this.filteredList.length;
  }

  loadMoreItems(): void {
    this.currentPage++;
    this.updateDisplayedList();
  }

  clearFilters(): void {
    this.selectedTypes = [];
    this.selectedGeneration = '';
    this.searchTerm = '';
    this.filteredList = [...this.completeList];
    this.initializePagination();
  }

  updateDetailsById(pokemonName: string) {
    this.pokemonService.getPokemon(pokemonName).subscribe((res: any) => {
      this.setSelectedPokemon(res);
    });
  }

  updateDetailsByName(pokemonName: string) {
    this.pokemonService.getPokemonByName(pokemonName).subscribe((res: any) => {
      this.setSelectedPokemon(res);
    });
  }

  updatePokemon(pokemon: any) {
    this.setSelectedPokemon(pokemon);
  }

  selectRange(start: number, count: number): void {
    if (start < 0 || count < 1 || start >= this.completeList.length) {
      throw new Error('Invalid range specified');
    }

    const end = Math.min(start + count, this.completeList.length);
    this.filteredList = this.completeList.slice(start, end);
    this.setSelectedPokemon(this.filteredList[0]);
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
}
