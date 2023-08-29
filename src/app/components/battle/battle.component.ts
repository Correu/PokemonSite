import { Component, Injectable, OnInit } from '@angular/core';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrls: ['./battle.component.css']
})

@Injectable()
export class BattleComponent implements OnInit {

  //two random teams of 6 pokemon
  //each pokemon has a level and a 
  //each pokemon has 4 moves random up to the current level they are at
  //turn based
  //

  ngOnInit(): void {
    //methods to initialize
  }
}
