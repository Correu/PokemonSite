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

  statusAbbrev(condition: string | null | undefined): string {
    const map: Record<string, string> = {
      burn: 'BRN',
      poison: 'PSN',
      paralysis: 'PAR',
      sleep: 'SLP',
      freeze: 'FRZ',
    };
    return condition ? (map[condition] ?? condition.toUpperCase().slice(0, 3)) : '';
  }

  readonly STAT_ABBREV: Record<string, string> = {
    attack: 'ATK',
    defense: 'DEF',
    specialAttack: 'SPA',
    specialDefense: 'SPD',
    speed: 'SPE',
    accuracy: 'ACC',
    evasion: 'EVA',
  };

  activeStages(statStages: Record<string, number> | undefined): { key: string; label: string; value: number }[] {
    if (!statStages) return [];
    return Object.entries(statStages)
      .filter(([, v]) => v !== 0)
      .map(([key, value]) => ({
        key,
        label: this.STAT_ABBREV[key] ?? key.toUpperCase().slice(0, 3),
        value,
      }));
  }

  arrowPrefix(value: number): string {
    const abs = Math.abs(value);
    const arrow = value > 0 ? '↑' : '↓';
    return abs >= 2 ? arrow + arrow : arrow;
  }
}
