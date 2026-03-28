import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BattleComponent } from './components/battle/battle.component';
import { PokedexComponent } from './components/pokedex/pokedex.component';
import { PokedexShellComponent } from './components/pokedex-shell/pokedex-shell.component';
import { PokedexAccessGuard } from './guards/pokedex-access.guard';

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
        component: BattleComponent,
        canActivate: [PokedexAccessGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
