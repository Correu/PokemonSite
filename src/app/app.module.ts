import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { PokedexComponent } from './components/pokedex/pokedex.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { BattleComponent } from './components/battle/battle.component';
import { EncounterComponent } from './components/encounter/encounter.component';
import { BattleDialogComponent } from './dialogs/battle-dialog/battle-dialog.component';
import { MoveDialogComponent } from './dialogs/move-dialog/move-dialog.component';
import { PokedexInstructionDialogComponent } from './dialogs/pokedex-instruction-dialog/pokedex-instruction-dialog.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PokemonDialogComponent } from './dialogs/pokemon-dialog/pokemon-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    PokedexComponent,
    NavigationComponent,
    BattleComponent,
    EncounterComponent,
    BattleDialogComponent,
    MoveDialogComponent,
    PokedexInstructionDialogComponent,
    PokemonDialogComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatExpansionModule,
    MatGridListModule,
    MatMenuModule,
    MatTabsModule,
    MatTableModule,
    MatListModule,
    ScrollingModule,
    MatDividerModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class AppModule {}
