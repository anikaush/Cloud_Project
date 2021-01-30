import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { CountrywiseComponent } from './countrywise/countrywise.component';
import { SecurePagesGuard } from './secure-pages.guard';
import { SigninComponent } from './signin/signin.component';

const routes: Routes = [
  { path: "signin", component: SigninComponent},
  { path: "countrywise", children:[{path: "**", component: CountrywiseComponent}]},
  //{ path: "countrywise", component: CountrywiseComponent, canActivate: [AuthGuard]},
  { path: "", pathMatch: "full", redirectTo: "signin" },
  { path: "**", redirectTo: "signin" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }