import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SuppliersListPage } from './suppliers-list.page';

const routes: Routes = [
  {
    path: '',
    component: SuppliersListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuppliersListPageRoutingModule {}
