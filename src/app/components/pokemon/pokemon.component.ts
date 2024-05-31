import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MoveDialogComponent } from '../move-dialog/move-dialog.component';

@Component({
  selector: 'app-pokemon',
  templateUrl: './pokemon.component.html',
  styleUrls: ['./pokemon.component.css']
})

export class PokemonComponent implements OnInit {

  //pokemon component used to show the use of inputs passed from parent to child components
  //as well as clean up the pokedex html code.
  @Input() selectedPokemon: any = '';

  constructor(private dialog: MatDialog) {

  }
  
  ngOnInit(): void {
  }

  private loadMoveDialog() {
    const movedialog = this.dialog.open(MoveDialogComponent);
  }
}
