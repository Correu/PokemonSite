import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-battle-dialog',
  templateUrl: './battle-dialog.component.html',
  styleUrls: ['./battle-dialog.component.css'],
})
export class BattleDialogComponent {
  inputLevel: number = 0;
  form: FormGroup = new FormGroup({
    level: new FormControl(new Level(this.inputLevel)),
  });

  constructor(
    private dialogRef: MatDialogRef<BattleDialogComponent>,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      inputLevel: [''],
    });
  }

  Submit(): void {
    this.dialogRef.close(this.form.value.inputLevel);
  }
}

export class Level {
  constructor(public level: number) {}
}
