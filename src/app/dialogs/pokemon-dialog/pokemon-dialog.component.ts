import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Pokemon } from 'src/app/interfaces/pokemon';

@Component({
  selector: 'app-pokemon-dialog',
  templateUrl: './pokemon-dialog.component.html',
  styleUrls: ['./pokemon-dialog.component.css']
})
export class PokemonDialogComponent {
  constructor(public dialog: MatDialogRef<PokemonDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  closeDialog() {
    this.dialog.close();
  }
}
