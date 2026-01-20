import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SocketService } from '../../services/socket/socket.service';

@Component({
  selector: 'app-battle-dialog',
  templateUrl: './battle-dialog.component.html',
  styleUrls: ['./battle-dialog.component.css'],
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
      useItems: [false], // Toggle for enabling/disabling items
      itemQuantity: [
        0,
        [Validators.min(0), Validators.max(6)],
      ],
      numberOfPokemon: [
        6,
        [Validators.required, Validators.min(1), Validators.max(6)],
      ],
      generation: [
        null, // Optional - null means use all generations
        [Validators.min(1), Validators.max(9)],
      ],
      useGenerationFilter: [false], // Checkbox to enable generation filter
    });
  }

  ngOnInit() { }

  async selectMode(selected: 'create' | 'join') {
    this.mode = selected;
    if (selected === 'create') {
      await this.createBattle();
      this.currentStep = 2; // Show room key sharing step
    }
  }

  async tryJoinRoom() {
    this.joinError = '';
    this.socketService.joinRoom(this.joinRoomKey, (response: any) => {
      if (response && response.success) {
        this.battleKey = this.joinRoomKey;
        this.currentStep = 3; // Skip to battle setup (host already configured)
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
    if (this.currentStep === 2) {
      this.currentStep = 3; // Move to battle setup
    } else if (this.currentStep === 3 && this.form.valid) {
      this.submitBattle();
    }
  }

  submitBattle() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const battleData = {
        roomKey: this.battleKey,
        level: formValue.level,
        useItems: formValue.useItems,
        itemQuantity: formValue.useItems ? formValue.itemQuantity : 0,
        numberOfPokemon: formValue.numberOfPokemon,
        generation: formValue.useGenerationFilter ? formValue.generation : null,
      };
      this.socketService.sendGameEvent(this.battleKey, battleData);
      this.dialogRef.close(battleData);
    }
  }

  // Update item quantity validators when useItems changes
  onUseItemsChange() {
    const useItems = this.form.get('useItems')?.value;
    const itemQuantityControl = this.form.get('itemQuantity');
    if (useItems) {
      itemQuantityControl?.setValidators([Validators.required, Validators.min(0), Validators.max(6)]);
    } else {
      itemQuantityControl?.setValidators([Validators.min(0), Validators.max(6)]);
      itemQuantityControl?.setValue(0);
    }
    itemQuantityControl?.updateValueAndValidity();
  }

  // Update generation validators when useGenerationFilter changes
  onUseGenerationFilterChange() {
    const useFilter = this.form.get('useGenerationFilter')?.value;
    const generationControl = this.form.get('generation');
    if (useFilter) {
      generationControl?.setValidators([Validators.required, Validators.min(1), Validators.max(9)]);
    } else {
      generationControl?.clearValidators();
      generationControl?.setValue(null);
    }
    generationControl?.updateValueAndValidity();
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a snackbar notification here if you want
      console.log('Battle key copied to clipboard');
    });
  }
}

export class Level {
  constructor(public level: number) { }
}
