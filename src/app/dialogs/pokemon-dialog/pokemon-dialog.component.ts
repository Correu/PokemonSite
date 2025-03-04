import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';

@Component({
  selector: 'app-pokemon-dialog',
  templateUrl: './pokemon-dialog.component.html',
  styleUrls: ['./pokemon-dialog.component.css']
})
export class PokemonDialogComponent {

  typeSprites: any[] = [];

  constructor(public dialog: MatDialogRef<PokemonDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private pokemonService: PokemonService) {
  }

  ngOnInit(): void {
    const pokemonTypes = this.data.pokemon.types.map((t: any) => t.type.name);
    console.log(pokemonTypes);
    this.pokemonService.getTypes(pokemonTypes).subscribe(data => {
      this.typeSprites = data;
      console.log(this.typeSprites.at(0));
    })
  }

  closeDialog() {
    this.dialog.close();
  }
}
