import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SocketService } from '../../services/socket/socket.service';

@Component({
    selector: 'app-battle-dialog',
    templateUrl: './battle-dialog.component.html',
    styleUrls: ['./battle-dialog.component.css'],
    standalone: false
})
export class BattleDialogComponent implements OnInit {
  currentStep = 1;
  mode: 'choose' | 'create' | 'join' = 'choose';
  battleKey: string = '';
  joinRoomKey: string = '';
  form: FormGroup;
  joinError: string = '';

  constructor(
    public dialogRef: MatDialogRef<BattleDialogComponent>,
    private fb: FormBuilder,
    private socketService: SocketService
  ) {
    this.form = this.fb.group({
      level: [
        '',
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      itemQuantity: [
        '',
        [Validators.required, Validators.min(0), Validators.max(6)],
      ],
      generation: [
        '',
        [Validators.required, Validators.min(1), Validators.max(9)],
      ],
    });
  }

  ngOnInit() {}

  async selectMode(selected: 'create' | 'join') {
    this.mode = selected;
    if (selected === 'create') {
      await this.createBattle();
      this.currentStep = 2;
    }
  }

  async tryJoinRoom() {
    this.joinError = '';
    this.socketService.joinRoom(this.joinRoomKey, (response: any) => {
      if (response && response.success) {
        this.battleKey = this.joinRoomKey;
        this.currentStep = 2;
      } else {
        this.joinError = response?.error || 'Failed to join room.';
      }
    });
  }

  async createBattle() {
    try {
      this.battleKey = await this.socketService.createGame();
      this.socketService.joinRoom(this.battleKey);
    } catch (err) {
      alert('Failed to create room');
    }
  }

  nextStep() {
    if (this.currentStep === 2 && this.form.valid) {
      this.submitBattle();
    }
  }

  submitBattle() {
    if (this.form.valid) {
      const battleData = {
        roomKey: this.battleKey,
        ...this.form.value,
      };
      this.socketService.sendGameEvent(this.battleKey, battleData);
      this.dialogRef.close(battleData);
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a snackbar notification here if you want
      console.log('Battle key copied to clipboard');
    });
  }
}

export class Level {
  constructor(public level: number) {}
}
