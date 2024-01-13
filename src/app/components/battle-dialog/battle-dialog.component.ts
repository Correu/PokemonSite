import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-battle-dialog',
  templateUrl: './battle-dialog.component.html',
  styleUrls: ['./battle-dialog.component.css']
})
export class BattleDialogComponent {
    form: FormGroup = new FormGroup({
      level: new FormControl(new Level(0)),
    });
}

export class Level {
  constructor(public level: number) {}
}
