import { Component, Injectable, OnInit } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon/pokemon.service';
import { Pokemon } from 'src/app/interfaces/pokemon';
import { MatDialog } from '@angular/material/dialog';
import { BattleDialogComponent } from '../../dialogs/battle-dialog/battle-dialog.component';
import { BattleService } from 'src/app/services/battle/battle.service';
import { TemplateLiteral } from '@angular/compiler';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrls: ['./battle.component.css'],
})
@Injectable()
export class BattleComponent implements OnInit {
  //implement a bag of items to select from to heal statuses in battle
  //implement change pokemon out functionality
  //implement level select to start the match

  //assign the values to display, carried from the service.
  playerTeam: Pokemon[] = this.pokemonService.playerTeam;
  enemyTeam: Pokemon[] = this.pokemonService.enemyTeam;
  selectedLevel: number = 0;

  teamA: Pokemon[] = [];
  teamB: Pokemon[] = [];

  constructor(
    private pokemonService: PokemonService,
    private battleService: BattleService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    if (!this.pokemonService.battleLoad) {
      this.intialDialog();
      this.battleService.getRandomTeams().subscribe(({ teamA, teamB }) => {
        this.teamA = teamA;
        this.teamB = teamB;
      })

      console.log(this.teamA);
      console.log(this.teamB);
    }
  }

  private intialDialog() {
    const dialogRef = this.dialog.open(BattleDialogComponent);

    dialogRef.afterClosed().subscribe((data) => {
      this.selectedLevel = data;
      console.log(this.selectedLevel + ' ' + data);
    });
  }
}
