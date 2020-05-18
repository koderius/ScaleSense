import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReceptionPage } from './reception.page';
import {LeaveReceptionGuard} from './leave-reception.guard';

const routes: Routes = [
  {
    path: ':id',
    component: ReceptionPage,
    canDeactivate: [LeaveReceptionGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReceptionPageRoutingModule {}
