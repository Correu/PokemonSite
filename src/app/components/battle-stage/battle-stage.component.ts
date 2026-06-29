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
    this.session.combatState$,
  ]).pipe(
    map(([player, foe, combat]) => ({
      player,
      foe,
      message: combat?.message ?? '',
    }))
  );

  constructor(public session: BattleSessionService) {}
}
