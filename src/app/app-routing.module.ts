import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BattleComponent } from './components/battle/battle.component';
import { EncounterComponent } from './components/encounter/encounter.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { PokedexComponent } from './components/pokedex/pokedex.component';
import { PokemonComponent } from './components/pokemon/pokemon.component';

const routes: Routes = [
  {
    path: "", component: PokedexComponent
  },{
    path: "pokemon/:pokeNumber", component: PokemonComponent
  },{
    path: "battle", component: BattleComponent
  },{
    path: "encounter", component: EncounterComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
