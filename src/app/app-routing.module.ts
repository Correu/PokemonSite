import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavigationComponent } from './components/navigation/navigation.component';
import { PokemonComponent } from './components/pokemon/pokemon.component';

const routes: Routes = [
  {
    path: "", component: NavigationComponent
  },{
    path: "pokemon/:pokeNumber", component: PokemonComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
