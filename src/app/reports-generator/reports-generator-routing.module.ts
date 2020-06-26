import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReportsGeneratorPage } from './reports-generator.page';

const routes: Routes = [
  {
    path: '',
    component: ReportsGeneratorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsGeneratorPageRoutingModule {}
