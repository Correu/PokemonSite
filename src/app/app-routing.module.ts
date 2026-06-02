import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BattleWorkspaceComponent } from './components/battle-workspace/battle-workspace.component';
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
        component: BattleWorkspaceComponent,
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
