import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BattleComponent } from './components/battle/battle.component';
import { EncounterComponent } from './components/encounter/encounter.component';
import { PokedexComponent } from './components/pokedex/pokedex.component';
import { PokedexAccessGuard } from './guards/pokedex-access.guard';

const routes: Routes = [
  {
    path: "", component: PokedexComponent
  }, {
    path: "battle", component: BattleComponent, canActivate: [PokedexAccessGuard]
  }, {
    path: "encounter", component: EncounterComponent, canActivate: [PokedexAccessGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
