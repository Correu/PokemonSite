import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Move } from 'src/app/interfaces/move';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';

@Component({
  selector: 'app-move-dialog',
  templateUrl: './move-dialog.component.html',
  styleUrls: ['./move-dialog.component.css'],
})
export class MoveDialogComponent {
  moveInfo!: Move;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { name: string },
    private pokemonService: PokemonService
  ) {}

  ngOnInit(): void {
    this.pokemonService.getMove(this.data.name).subscribe((res: any) => {
      this.moveInfo = res;
      console.log(res);
    });
  }
}
