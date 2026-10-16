import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BattleUnderConstructionComponent } from './components/battle-under-construction/battle-under-construction.component';
import { PokedexComponent } from './components/pokedex/pokedex.component';
import { PokedexShellComponent } from './components/pokedex-shell/pokedex-shell.component';

const routes: Routes = [
  {
    path: '',
    component: PokedexShellComponent,
    children: [
      {
        path: '',
        component: PokedexComponent,
      },
      {
        path: 'battle',
        component: BattleUnderConstructionComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
