import { Component } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { BattleSessionService } from 'src/app/services/battle/battle-session.service';

@Component({
  selector: 'app-battle-stage',
  templateUrl: './battle-stage.component.html',
  styleUrls: ['./battle-stage.component.css'],
  standalone: false,
})
export class BattleStageComponent {
  readonly vm$ = combineLatest([
    this.session.playerStage$,
    this.session.opponentStage$,
  ]).pipe(
    map(([player, foe]) => ({
      player,
      foe,
    }))
  );

  constructor(public session: BattleSessionService) {}
}
