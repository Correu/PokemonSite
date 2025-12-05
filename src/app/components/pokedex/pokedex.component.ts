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
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css'],
  standalone: false,
})
@Injectable()
export class PokedexComponent implements OnInit, OnDestroy {
  isDragging = false;
  startX = 0;
  scrollLeft = 0;
  velocityX = 0;
  lastX = 0;
  lastTime = 0;
  momentumId: any;

  cards = [
    {
      title: 'Card 1',
      subtitle: 'First card',
      content:
        'This is the content of the first card. Click and drag to scroll through the cards.',
    },
    {
      title: 'Card 2',
      subtitle: 'Second card',
      content:
        'Another card with interesting content. The scroll is smooth and responsive.',
    },
    {
      title: 'Card 3',
      subtitle: 'Third card',
      content: 'Keep scrolling to see more cards in this horizontal layout.',
    },
    {
      title: 'Card 4',
      subtitle: 'Fourth card',
      content:
        'Material Design cards look great with this dragging functionality.',
    },
    {
      title: 'Card 5',
      subtitle: 'Fifth card',
      content:
        'You can add as many cards as you need to this scrollable container.',
    },
    {
      title: 'Card 6',
      subtitle: 'Sixth card',
      content: 'The drag-to-scroll feature works seamlessly across all cards.',
    },
    {
      title: 'Card 7',
      subtitle: 'Seventh card',
      content: 'Almost at the end! This demonstrates the scrolling capability.',
    },
    {
      title: 'Card 8',
      subtitle: 'Eighth card',
      content:
        'Last card in the collection. You can easily scroll back to the beginning.',
    },
  ];

  onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    const container = e.currentTarget as HTMLElement;
    this.startX = e.pageX - container.offsetLeft;
    this.scrollLeft = container.scrollLeft;
    this.lastX = e.pageX;
    this.lastTime = Date.now();
    this.velocityX = 0;

    // Cancel any ongoing momentum
    if (this.momentumId) {
      cancelAnimationFrame(this.momentumId);
    }
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    const container = e.currentTarget as HTMLElement;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - this.startX) * 2;
    container.scrollLeft = this.scrollLeft - walk;

    // Calculate velocity for momentum
    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastTime;
    if (timeDelta > 0) {
      this.velocityX = (e.pageX - this.lastX) / timeDelta;
    }
    this.lastX = e.pageX;
    this.lastTime = currentTime;
  }

  onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.applyMomentum();
    }
  }

  applyMomentum() {
    const container = document.querySelector(
      '.card-scroll-container'
    ) as HTMLElement;
    if (!container) return;

    const friction = 0.99; // Friction coefficient (higher = longer scroll)
    const minVelocity = 0.4; // Minimum velocity threshold

    const animate = () => {
      if (Math.abs(this.velocityX) > minVelocity) {
        container.scrollLeft -= this.velocityX * 16; // 16ms frame time approximation
        this.velocityX *= friction;
        this.momentumId = requestAnimationFrame(animate);
      } else {
        this.velocityX = 0;
      }
    };

    // Only apply momentum if there's significant velocity
    if (Math.abs(this.velocityX) > minVelocity) {
      this.momentumId = requestAnimationFrame(animate);
    }
  }

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

  // New filter properties
  selectedTypes: string[] = [];
  selectedGeneration: string = '';
  searchTerm: string = '';
  availableTypes: string[] = [];

  // Pagination properties
  displayedList: Pokemon[] = [];
  itemsPerPage: number = 20;
  currentPage: number = 1;
  hasMoreItems: boolean = true;

  constructor(
    public pokemonService: PokemonService,
    public dialog: MatDialog,
    @Inject(FormBuilder) private fp: FormBuilder
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

  // New filter methods
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

    // Filter by generation
    if (this.selectedGeneration) {
      const generation = this.pokemonService.generations.find(
        (g) => g.name === this.selectedGeneration
      );
      if (generation) {
        const start = generation.start;
        const end = Math.min(
          start + generation.quantity,
          this.completeList.length
        );
        filtered = filtered.slice(start, end);
      }
    }

    // Filter by type - Pokemon must have ALL selected types
    if (this.selectedTypes.length > 0) {
      filtered = filtered.filter((pokemon) => {
        if (!pokemon.types) return false;

        // Get the Pokemon's type names
        const pokemonTypeNames = pokemon.types
          .map((type) => type.type?.name)
          .filter((name) => name !== undefined) as string[];

        // Check if Pokemon has ALL selected types
        return this.selectedTypes.every((selectedType) =>
          pokemonTypeNames.includes(selectedType)
        );
      });
    }

    // Filter by search term
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
    const startIndex = 0;
    const endIndex = this.currentPage * this.itemsPerPage;
    this.displayedList = this.filteredList.slice(startIndex, endIndex);
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
