import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { BattleFieldState, BattlePhase } from 'src/app/interfaces/battle';
import { BattleStateService } from 'src/app/services/battle/battle-state.service';

@Component({
  selector: 'app-battle-field',
  templateUrl: './battle-field.component.html',
  styleUrls: ['./battle-field.component.css'],
  standalone: false,
})
export class BattleFieldComponent {
  readonly field$: Observable<BattleFieldState> = this.battleState.field$;
  readonly phase$: Observable<BattlePhase> = this.battleState.phase$;

  constructor(private battleState: BattleStateService) {}

  hpPercent(current: number, max: number): number {
    if (max <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, (current / max) * 100));
  }

  genderSymbol(gender: 'male' | 'female' | null): string {
    if (gender === 'female') {
      return '♀';
    }
    if (gender === 'male') {
      return '♂';
    }
    return '';
  }
}
